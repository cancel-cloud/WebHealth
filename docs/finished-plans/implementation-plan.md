# Webhealth Implementation Plan

This document outlines the architecture, database schema, and steps to build the Webhealth SaaS application according to the provided requirements.

## Proposed Architecture

1.  **Framework**: Next.js (App Router), Tailwind CSS, shadcn/ui.
2.  **Database**: PostgreSQL, accessed via Drizzle ORM for type-safe queries and schema definition.
3.  **Authentication**: Better Auth with the `google` provider. We will request extra scopes (`https://www.googleapis.com/auth/webmasters.readonly`, `https://www.googleapis.com/auth/analytics.readonly`) and use `access_type="offline"` to store refresh tokens for background syncing.
4.  **AI Integration**: OpenAI API (gpt-4o or similar depending on the env var) for analyzing metrics and generating Quick Wins.
5.  **Web Crawling**: Puppeteer or Cheerio-based crawler running in an async job to check title tags, meta descriptions, H1s, and internal links (limit to max pages).

## Proposed Changes

### Database Schema (Drizzle ORM)

```typescript
// users & sessions (managed largely by Better Auth)
export const users = pgTable('users', { ... });
// teams
export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  tier: text('tier').default('free').notNull(),
});
// properties
export const properties = pgTable('properties', {
  id: text('id').primaryKey(), // e.g., sc-domain:example.com
  teamId: text('team_id').notNull().references(() => teams.id),
  type: text('type').notNull(), // 'gsc', 'ga4'
  name: text('name').notNull(),
  url: text('url').notNull(),
  ga4PropertyId: text('ga4_property_id'), // for linking GSC and GA4
  syncStatus: text('sync_status').default('pending'), // pending, syncing, complete, failed
  lastSyncedAt: timestamp('last_synced_at'),
});
// reports
export const reports = pgTable('reports', {
  id: text('id').primaryKey(),
  teamId: text('team_id').notNull().references(() => teams.id),
  propertyId: text('property_id').notNull().references(() => properties.id),
  dateRangeStart: date('date_range_start').notNull(),
  dateRangeEnd: date('date_range_end').notNull(),
  compareRangeStart: date('compare_range_start').notNull(),
  compareRangeEnd: date('compare_range_end').notNull(),
  status: text('status').default('queued'), // queued, processing, complete, failed
  data: jsonb('data'), // Store GSC + GA4 metrics
  quickWins: jsonb('quick_wins'), // AI generated
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Authentication & Authorization

- Configure Better Auth in `lib/auth.ts`.
- Automatically create a "Solo" team when a user first signs in if they don't belong to any team.
- Ensure the Better Auth callback handles writing the Google OAuth access/refresh tokens to the DB.
- Use `getServerSession` checks on all protected routes and API endpoints.

### Property Syncing

- **Sync Trigger**: Upon first login or manual refresh button on the dashboard.
- **Batched Fetching**: Create an API route or background script that iterates over properties needing sync. Calls Google Search Console API and Google Analytics Data API.
- **Matching**: Match GSC domain patterns (like `sc-domain:example.com` or `https://example.com/`) to GA4 property URLs where possible to link them.

### Reporting & Crawl

- **Async Kickoff**: Create report record with status `queued`. Trigger a background or async fetch sequence.
- **Crawl**: Run a bounded edge-crawl using a library to fetch HTML and extract `<title>`, meta descriptions, `<h1>`, and check internal links (using `fetch` to verify 200 OM).
- **Combine**: Send the delta (Jan vs Feb traffic) + crawl anomalies to OpenAI to yield actionable Quick Wins.
- **Export**: Use mapping libraries (like `exceljs` for XLSX, standard Markdown formatting, and something like `jspdf` or `react-to-pdf` for PDF).

## Verification Plan

### Automated/Manual Verification

1.  **Auth Flow**: Manually click "Sign in with Google" -> Verify session persists, teams table populates, and Google refresh tokens are stored.
2.  **Property Sync**: Manually click "Sync Properties" -> Check DB to ensure `properties` are populated and linked correctly.
3.  **Report Generation**: Create a report from the UI -> Watch status change from queued -> processing -> complete. Verify `reports` table contains valid JSON data + AI output.
4.  **Exports**: Click Export (XLSX, MD, PDF) -> Download the file and open it locally to confirm the format matches expectations.

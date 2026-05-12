# WebHealth SEO Fix Plan — 14-Day Implementation Roadmap
*Companion to `seo-audit-2026-05-12.md`. Confirmed scope: chosen options from the AskUserQuestion modal on 2026-05-12.*

## Scope Confirmed by Lukas

| Audit Priority | Decision |
|---|---|
| #1 Sitemap + indexing | Proceed (only one path) |
| #2 Legal canonical | **Option A — path-based locales** (`/de/impressum`, `/en/impressum`, etc.) with 301 redirects from `?lang=de` |
| #3 Internal links | **Positioning section** of homepage + **Footer in `marketing-shell.tsx`** |
| #4 Backlinks | **DevBrew main-site link** (verify existing link is dofollow/indexable) + **LinkedIn long-form post** (drafted in `linkedin-post-2026-05-12.md`). OMR/Capterra/GetApp + ProductHunt deferred. |
| #5 Topic page content | **Shorten title ≤58 chars**, **add 'Was zeigt ein monatlicher SEO-Report?' H2 block**, **expand FAQ to 8–10 + move comparison table from homepage**. BreadcrumbList JSON-LD deferred. |

---

## Pre-Flight Checklist (Day 0)

Before opening any PR, sanity-check the working state.

- [ ] On `main` (or your active SEO branch), `pnpm install && pnpm typecheck` passes.
- [ ] `pnpm test` passes for the marketing test files we'll touch: `apps/web/src/app/(marketing)/legal/legal.test.ts`, `apps/web/src/app/sitemap.test.ts`, `apps/web/src/app/(marketing)/agency-seo.logic.test.ts`, `apps/web/src/app/(marketing)/agency-seo-topic-page.test.ts`, `apps/web/src/app/(marketing)/page.test.ts`.
- [ ] Confirm `BETTER_AUTH_URL` in `.env.local` matches your local tunnel (per `CLAUDE.md`).
- [ ] GSC access confirmed at https://search.google.com/search-console for property `webhealth.devbrew.dev`.

---

## Priority #1 — Submit Sitemap + Request Indexing
**Owner**: Lukas (manual GSC work) · **Effort**: ~30 min · **Day**: 1

No code changes — purely GSC console work.

### Steps
1. Open GSC → property `webhealth.devbrew.dev`.
2. **Sitemaps panel** → submit `https://webhealth.devbrew.dev/sitemap.xml`. Confirm status = "Success" within 24h.
3. **URL Inspection** → for each of the 8 unindexed URLs below, paste, then click "Request Indexing". Wait for the live-test pass before clicking.

   Priority order (most commercial intent first):
   1. `https://webhealth.devbrew.dev/en/seo-reporting-software-agencies`
   2. `https://webhealth.devbrew.dev/en`
   3. `https://webhealth.devbrew.dev/pricing`
   4. `https://webhealth.devbrew.dev/demo`
   5. `https://webhealth.devbrew.dev/about`
   6. `https://webhealth.devbrew.dev/privacy`
   7. `https://webhealth.devbrew.dev/terms`
   8. `https://webhealth.devbrew.dev/dpa`

4. Wait for the **Priority #2 PR** (legal path refactor) to ship before resubmitting the legal pages — otherwise you'll have to re-request after URLs change.

### Acceptance
- Sitemap status in GSC = "Success", "Discovered" ≥ 11 (or whatever new count after #2 ships).
- At day 7, run URL Inspection again on each — at least 6/8 should show "URL is on Google".

---

## Priority #2 — Path-Based Legal Locales (Option A)
**Owner**: apps/web · **Effort**: ~2–3h · **Days**: 2–4

Refactor `/impressum`, `/privacy`, `/terms`, `/dpa` so the German variant lives at `/de/impressum`, `/de/privacy`, etc. Drop the `?lang=de` query-param pattern entirely. Add 301 redirects.

### Files to touch

| File | Change |
|---|---|
| `apps/web/src/app/(marketing)/legal/legal-routes.ts` | Replace `buildLegalHref` so DE returns `/de/${path}` (no query string). Update `LEGAL_DOCUMENT_PATHS` if it's the source of truth for the EN paths. |
| `apps/web/src/app/(marketing)/legal/legal.ts` | Line 35: change `localePath = locale === "de" ? "${path}?lang=de" : path` → `localePath = locale === "de" ? "/de${path}" : path`. Line 42–44: `alternates.languages` change to `{ en: path, de: "/de${path}" }`. |
| `apps/web/src/app/(marketing)/impressum/page.tsx` | This stays as the **English** route at `/impressum`. Delete the `searchParams` plumbing — locale is no longer query-derived. Default to `locale: "en"`. |
| New: `apps/web/src/app/(marketing)/de/impressum/page.tsx` | Thin route that delegates to the same `LegalDocumentPage` but with `locale: "de"` hard-coded. Same pattern for the other 3. |
| New: `apps/web/src/app/(marketing)/de/privacy/page.tsx` | (as above) |
| New: `apps/web/src/app/(marketing)/de/terms/page.tsx` | (as above) |
| New: `apps/web/src/app/(marketing)/de/dpa/page.tsx` | (as above) |
| `apps/web/src/app/sitemap.ts` | Replace single legal entries with paired EN/DE entries (8 entries total instead of 4). |
| `apps/web/src/app/(marketing)/agent-discovery.logic.ts` | Update `getRobotsTxt()` allow-list to add `/de/impressum`, `/de/privacy`, `/de/terms`, `/de/dpa`. Update `MARKDOWN_DOCUMENT_PATHS` set if you want Markdown export for the new paths. |
| `apps/web/src/app/(marketing)/marketing-shell.tsx` | Footer legal links — `LegalFooterLinks` already locale-aware via `legal-footer-links.tsx`; verify `buildLegalHref` returns the new paths. |
| `apps/web/middleware.ts` (or `next.config.ts` redirects) | Add permanent 301 redirects: `/impressum?lang=de → /de/impressum`, plus the 3 others. |

### Redirect spec (in `next.config.ts`)

```ts
async redirects() {
  return [
    { source: '/impressum', has: [{ type: 'query', key: 'lang', value: 'de' }], destination: '/de/impressum', permanent: true },
    { source: '/privacy',   has: [{ type: 'query', key: 'lang', value: 'de' }], destination: '/de/privacy',   permanent: true },
    { source: '/terms',     has: [{ type: 'query', key: 'lang', value: 'de' }], destination: '/de/terms',     permanent: true },
    { source: '/dpa',       has: [{ type: 'query', key: 'lang', value: 'de' }], destination: '/de/dpa',       permanent: true },
  ];
}
```

### Tests to update
- `apps/web/src/app/(marketing)/legal/legal.test.ts`: lines 34–35, 66–67, 73–76 currently assert `?lang=de` — update to `/de/impressum`, `/de/privacy`, etc.
- `apps/web/src/app/sitemap.test.ts`: add the 4 new `/de/...` URLs to expected list.

### After ship
- In GSC, re-submit sitemap (it auto-discovers new entries since it's the same `sitemap.xml` URL).
- Run URL Inspection on the 4 new DE URLs to push them into the queue.
- Mark `/impressum?lang=de` for removal via GSC "Removals" tool **only after** confirming the 301 is live and Google has crawled the new URL once.

### Acceptance
- `curl -I https://webhealth.devbrew.dev/impressum?lang=de` returns 301 → `/de/impressum`.
- Live HTML on `/de/impressum` has `<link rel="canonical" href="https://webhealth.devbrew.dev/de/impressum">` and `<link rel="alternate" hreflang="de" href="https://webhealth.devbrew.dev/de/impressum">`.
- All tests pass: `pnpm test`.
- 14 days post-merge: GSC shows `/de/impressum` as the indexed URL, not the `?lang=de` version.

---

## Priority #3 — Internal Links to the SEO Topic Page
**Owner**: apps/web · **Effort**: ~45 min · **Day**: 5

Add two link surfaces from homepage → `/de/seo-reporting-tool-agenturen` (and EN equivalent). Skip the Erster Snapshot and hero CTA placements per your choice.

### 3a. Positioning section link (in-content)

**File**: `apps/web/src/app/(marketing)/agency-homepage-client.tsx`

Find the section currently rendering the "Kein Ersatz für deine SEO-Tools. Die Entscheidungsschicht darüber." copy (search `Kein Ersatz` in the file). After the closing paragraph, add a single anchor:

```tsx
import { getAgencySeoTopicPath } from "./agency-seo.logic";

// ...inside the positioning section JSX:
<p className="mt-4 text-sm">
  {language === "de" ? (
    <>
      Mehr zum Konzept:{" "}
      <Link
        href={getAgencySeoTopicPath("de")}
        className="font-medium underline underline-offset-4 hover:text-foreground"
      >
        SEO Reporting Tool für Agenturen — wie aus Monatsreports Maßnahmen werden
      </Link>
      .
    </>
  ) : (
    <>
      Read more on the concept:{" "}
      <Link
        href={getAgencySeoTopicPath("en")}
        className="font-medium underline underline-offset-4 hover:text-foreground"
      >
        SEO reporting software for agencies — how monthly reports become action plans
      </Link>
      .
    </>
  )}
</p>
```

The exact wording matches the existing copy register (founder-led, concept-first). The anchor text uses the **target keyword phrase** verbatim — that's the SEO signal you want.

### 3b. Footer link in `marketing-shell.tsx`

**File**: `apps/web/src/app/(marketing)/marketing-shell.tsx`

Add a sibling link to the existing "About" / "Pricing" / legal footer nav. It needs to be locale-aware. Easiest path:

```tsx
"use client";
import { usePathname } from "next/navigation";
import { getAgencySeoTopicPath } from "./agency-seo.logic";

// In MarketingFooter, before the About link:
function TopicFooterLink() {
  const pathname = usePathname();
  const language = pathname.startsWith("/en") ? "en" : "de";
  const label = language === "de"
    ? "SEO Reporting Tool für Agenturen"
    : "SEO reporting software for agencies";
  return (
    <Link
      href={getAgencySeoTopicPath(language)}
      className="text-xs transition-colors hover:underline"
      style={{ color: "oklch(0.55 0.02 250)" }}
    >
      {label}
    </Link>
  );
}

// Then mount <TopicFooterLink /> inside the <nav> alongside About/Pricing.
```

### Tests to add
- Snapshot or DOM test in `agency-homepage.logic.test.ts` (or a new `marketing-shell.test.ts`) that asserts a link to `/de/seo-reporting-tool-agenturen` exists in the rendered DE homepage and footer.

### Acceptance
- View source of `https://webhealth.devbrew.dev/de` and grep for `seo-reporting-tool-agenturen` — should appear ≥2 times (positioning + footer).
- Same for `/en` with `seo-reporting-software-agencies`.

---

## Priority #4a — Verify DevBrew → WebHealth Backlink
**Owner**: Lukas (manual) · **Effort**: ~15 min · **Day**: 6

You mentioned the link from `devbrew.dev` already exists. Verify it's actually doing work:

### Verification checklist
- [ ] `curl -sL https://devbrew.dev | grep -i "webhealth"` returns a hit with a real `<a href>` (not just JS-injected text).
- [ ] The anchor is **not** `rel="nofollow"`, `rel="ugc"`, or `rel="sponsored"`. Standard `<a href>` only.
- [ ] Anchor text is descriptive (ideally contains "SEO reporting" or "WebHealth"), not bare URL.
- [ ] The link lives on a crawlable page (check `https://devbrew.dev/robots.txt` to confirm the page isn't disallowed).
- [ ] In GSC for `webhealth.devbrew.dev`, after 7–14 days check **Links → Top linking sites** for `devbrew.dev`. If it doesn't appear, the link isn't being counted.

### If it needs strengthening
- Add a second link from a more content-heavy page on devbrew.dev (a project/products page rather than just the footer).
- Use anchor text in line with the buyer query: e.g., *"SEO Reporting Tool für Agenturen"*.

---

## Priority #4b — LinkedIn Long-Form Post
**Owner**: Lukas (publish from his account) · **Drafted in**: `linkedin-post-2026-05-12.md` · **Day**: 7

A separate file holds the LinkedIn post. See that file for the draft. After publishing, the LinkedIn URL becomes a backlink target — add it as an anchor in subsequent content.

### Post-publish checklist
- [ ] LinkedIn URL of the published post: ____________________ (fill in)
- [ ] Cross-post a short variant to LinkedIn pages of any DACH agency partners.
- [ ] Add the LinkedIn post URL to your tracking spreadsheet of inbound links.
- [ ] After 30 days, check GSC **Links → Top linking sites** for `linkedin.com`.

---

## Priority #5 — Topic Page Content Expansion
**Owner**: apps/web (code) + Lukas (copy) · **Effort**: ~5–6h total · **Days**: 11–13

Three sub-tasks. BreadcrumbList JSON-LD deferred per your choice.

### 5a. Shorten the topic page title (≤58 chars)

**File**: `apps/web/src/app/(marketing)/agency-seo.logic.ts`

```ts
// Currently:
const AGENCY_TOPIC_TITLES: Record<AgencyLandingLanguage, string> = {
  de: "SEO Reporting Tool für Agenturen | Monatsreports zu Maßnahmen",  // 64 chars
  en: "SEO Reporting Software for Agencies | Monthly Reports to Action", // 64 chars
};

// Change to:
const AGENCY_TOPIC_TITLES: Record<AgencyLandingLanguage, string> = {
  de: "SEO Reporting Tool für Agenturen — Monats-Snapshots",   // 52 chars
  en: "SEO Reporting Software for Agencies — Monthly Snapshots", // 56 chars
};
```

Both new variants keep the head keyword in front, drop the redundant "Tool/Software" framing, swap "Reports zu Maßnahmen" for "Monats-Snapshots" which is shorter and matches `seo reporting monatlich` more literally.

**Test**: update `agency-seo.logic.test.ts` if any test snapshots the old title.

### 5b. New H2 block — "Was zeigt ein monatlicher SEO-Report?"

**File**: `apps/web/src/app/(marketing)/agency-seo-topic-page.tsx`

Add a new section between the existing `problemBody` and `workflowTitle` sections. Targeting the queries `seo reporting monatlich` (3 imp, pos 81.67) and `monatlicher seo report` (1 imp, pos 72) — these are intent-specific and underserved on the page today.

Suggested copy (German — write EN translation alongside):

```tsx
{/* New section after the problem section */}
<section className="px-6 py-16 border-b border-border" id="monatlicher-seo-report">
  <div className="mx-auto max-w-3xl">
    <h2 className="font-display text-3xl font-semibold tracking-tight">
      {language === "de"
        ? "Was zeigt ein monatlicher SEO-Report für Agenturen?"
        : "What does a monthly SEO report for agencies show?"}
    </h2>
    <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
      {language === "de"
        ? "Ein nutzbarer Monatsreport beantwortet vier Fragen für das Kundenmeeting — alles andere ist Datenballast:"
        : "A useful monthly report answers four questions for the client meeting — everything else is data clutter:"}
    </p>
    <ul className="mt-6 space-y-4 text-base">
      <li>
        <strong>{language === "de" ? "Was hat sich verändert?" : "What changed?"}</strong>{" "}
        {/* KPI deltas from GSC and GA4 — clicks, impressions, sessions, position. */}
      </li>
      <li>
        <strong>{language === "de" ? "Welche Seiten haben verloren?" : "Which pages lost?"}</strong>{" "}
        {/* Page-level traffic drops with the supporting analytics. */}
      </li>
      <li>
        <strong>{language === "de" ? "Welche Queries sind nahe an besseren Positionen?" : "Which queries are close to better positions?"}</strong>{" "}
        {/* CTR gaps, position 4-10 striking-distance queries. */}
      </li>
      <li>
        <strong>{language === "de" ? "Welche 3-5 Maßnahmen gehören in diese Woche?" : "Which 3-5 actions belong in this week?"}</strong>{" "}
        {/* Ranked action backlog with affected URLs. */}
      </li>
    </ul>
    <p className="mt-6 text-sm text-muted-foreground">
      {language === "de"
        ? "WebHealth ordnet GSC, GA4 und Crawl-Daten genau in dieser Reihenfolge — von Veränderung zur priorisierten Maßnahme."
        : "WebHealth orders GSC, GA4, and crawl data in exactly that sequence — from change to prioritized action."}
    </p>
  </div>
</section>
```

The H2 wording matches the query phrase verbatim — that's the on-page-SEO signal Google needs.

### 5c. Expand FAQ + move comparison table

**Files**:
- `apps/web/src/app/(marketing)/agency-homepage.content.ts` — extend `AGENCY_FAQ_ITEMS` from 4 to 8–10 items, OR create a new `AGENCY_TOPIC_FAQ_ITEMS` if you want the topic page FAQ to be distinct.
- `apps/web/src/app/(marketing)/agency-seo-topic-page.tsx` — render the expanded FAQ here. Also import the "Manuelle Snapshot-Arbeit vs. Mit Webhealth" comparison table component from `agency-homepage-client.tsx` and render it inside the topic page.

**Suggested new FAQ items** (German first, EN parallel):

1. *"Wie unterscheidet sich WebHealth von Looker Studio?"* — Looker is a dashboard tool; WebHealth is a decision layer that turns dashboard data into ranked actions. Short, evidence-grounded.
2. *"Wie oft wird ein Monats-Snapshot generiert?"* — Once a month, on a configurable day. Pilot starts manually for the first deliverable.
3. *"Welche GSC-Properties werden unterstützt?"* — Both URL-prefix and domain properties (`sc-domain:`).
4. *"Kann ich mehrere Kunden mit getrennten Berechtigungen verwalten?"* — Pilot: yes, but granular per-client rights are roadmap.
5. *"Werden meine Kundendaten in der EU gehostet?"* — Yes, German hosting provider, DSGVO-konform.
6. *"Wie viel Setup-Zeit pro Kundenseite ist nötig?"* — 2 clicks via Google OAuth + ~5 min property mapping.

Then for the comparison table: extract the current homepage comparison (`Typische Zeit pro Kunde / Monat`, `Zusammengesetzte Datenquellen`, `Priorisiertes "Was als Nächstes?"`, etc.) into a reusable component (suggested path: `apps/web/src/components/before-after-comparison.tsx`) and import it in both the homepage AND `agency-seo-topic-page.tsx`. Don't duplicate the markup.

### Tests
- Update `agency-seo-topic-page.test.ts` to assert the new section exists and the H2 contains "monatlicher SEO-Report" / "monthly SEO report".
- Add a test for the extracted comparison component if you create one.

### Acceptance
- Topic page word count moves from ~600 (today) to ~1,400+.
- New H2 visible at `https://webhealth.devbrew.dev/de/seo-reporting-tool-agenturen#monatlicher-seo-report`.
- Comparison table renders on both `/de` and `/de/seo-reporting-tool-agenturen` from the same component.

---

## Bonus / Tech-Debt Items (Not in 14-Day Plan, But Cheap)

These came up during the audit and aren't gated on anything else. Sweep them into the same PR series if you have bandwidth:

| Item | File | Effort |
|---|---|---|
| Remove `public/.DS_Store` and add to `.gitignore` | `apps/web/public/.DS_Store`, `.gitignore` | 1 min |
| Confirm dashboard routes set their own `<title>` (GA4 shows 760 page-views falling back to the generic root title) | `apps/web/src/app/(app)/dashboard/...`, `apps/web/src/app/(app)/admin/...` | 30 min — audit |
| Add `Offer` JSON-LD to `/pricing` (4 plans: €0/€29/€79/€149) | `apps/web/src/app/(marketing)/pricing/page.tsx` | 1h |
| Add `BreadcrumbList` to `buildAgencyJsonLd` for topic pages (deferred from Priority #5 — keep on the backlog) | `apps/web/src/app/(marketing)/agency-seo.logic.ts` | 30 min |

---

## 14-Day Timeline (Confirmed)

| Day | Action | Owner | Output |
|---|---|---|---|
| 1 | Pre-flight: tests + typecheck green | Lukas | clean baseline |
| 1 | GSC sitemap submit + 8 URL inspection requests | Lukas | 8 indexing requests in queue |
| 2–4 | Priority #2 — path-based legal locales (refactor + redirects + tests) | apps/web | PR merged |
| 5 | Priority #3 — homepage positioning link + footer link | apps/web | PR merged |
| 6 | Priority #4a — verify DevBrew → WebHealth backlink quality | Lukas | check passed or fix queued |
| 7 | Priority #4b — publish LinkedIn post from `linkedin-post-2026-05-12.md` | Lukas | post live, URL captured |
| 8–10 | Buffer + GSC monitoring (re-submit sitemap after #2 ships) | Lukas | 8+ URLs in GSC index |
| 11 | Priority #5a — shorten topic page title | apps/web | PR merged |
| 12 | Priority #5b — add "Was zeigt ein monatlicher SEO-Report?" H2 block | apps/web | PR merged |
| 13 | Priority #5c — expand FAQ to 8–10 + extract & embed comparison table | apps/web | PR merged |
| 14 | Re-audit: pull GSC for 2026-05-13 → 2026-05-26. Target: 8+ unique URLs with ≥1 impression. | Lukas | next-cycle decisions |

---

## Day-14 Re-Audit KPIs

| KPI | Today | Day-14 Target | Day-30 Stretch |
|---|---|---|---|
| Unique URLs with ≥1 GSC impression | 3 | 8 | 11 (all sitemap) |
| Total impressions / 28d | 24 | 80 | 200 |
| Position on `/de/seo-reporting-tool-agenturen` for "seo reporting tool für agenturen" | 62 | 45 | 25 |
| GA4 new users with channel = Organic Search | 0 | 3 | 10 |
| GSC referring domains (Top linking sites) | 0 visible | 2 (DevBrew + LinkedIn) | 5 |
| Indexed `/impressum?lang=de` → `/de/impressum` migration complete | n/a | yes | yes |

---

## Files Modified (Anticipated)

```
apps/web/src/app/(marketing)/legal/legal.ts                          # Priority #2
apps/web/src/app/(marketing)/legal/legal-routes.ts                   # Priority #2
apps/web/src/app/(marketing)/legal/legal.test.ts                     # Priority #2
apps/web/src/app/(marketing)/impressum/page.tsx                      # Priority #2
apps/web/src/app/(marketing)/privacy/page.tsx                        # Priority #2
apps/web/src/app/(marketing)/terms/page.tsx                          # Priority #2
apps/web/src/app/(marketing)/dpa/page.tsx                            # Priority #2
apps/web/src/app/(marketing)/de/impressum/page.tsx                   # NEW
apps/web/src/app/(marketing)/de/privacy/page.tsx                     # NEW
apps/web/src/app/(marketing)/de/terms/page.tsx                       # NEW
apps/web/src/app/(marketing)/de/dpa/page.tsx                         # NEW
apps/web/src/app/sitemap.ts                                          # Priority #2 + bonus
apps/web/src/app/sitemap.test.ts                                     # Priority #2
apps/web/src/app/(marketing)/agent-discovery.logic.ts                # Priority #2
apps/web/next.config.ts                                              # Priority #2 (redirects)
apps/web/src/app/(marketing)/agency-homepage-client.tsx              # Priority #3 (positioning link)
apps/web/src/app/(marketing)/marketing-shell.tsx                     # Priority #3 (footer link)
apps/web/src/app/(marketing)/agency-seo.logic.ts                     # Priority #5a (title)
apps/web/src/app/(marketing)/agency-seo-topic-page.tsx               # Priority #5b + 5c
apps/web/src/app/(marketing)/agency-homepage.content.ts              # Priority #5c (FAQ)
apps/web/src/components/before-after-comparison.tsx                  # NEW (Priority #5c, optional)
apps/web/public/.DS_Store                                            # DELETE (bonus)
.gitignore                                                           # bonus
```

---

## Open Questions / Things I Was Uncertain About

1. **DevBrew → WebHealth link** is reported to exist but I couldn't independently verify (web_fetch URL not in provenance set). Plan assumes "verify and strengthen" rather than "create from scratch." If the link is JS-injected only or `rel="nofollow"`, escalate to "add a real `<a>` from devbrew.dev/products page" before Day 7.

2. **LinkedIn post language**: drafted in German (matches DACH-first audit positioning + your existing draft language is unknown). EN translation can follow if helpful.

3. **`/dashboard` GA4 page-view dominance** (760 views of generic "Webhealth | SEO & Analytics Monitoring" title): I treated this as cosmetic — those routes are blocked from Google by robots.txt anyway. If most of those 760 views are internal team testing, ignore. If they represent real users hitting routes without per-page `<title>`, that's an analytics-hygiene fix worth doing separately.

4. **Translation depth** for Priority #5b/5c: I drafted German copy with English placeholders. You'll want to write the EN copy yourself or have it reviewed — the technical agency vocabulary needs a native-speaker pass.

5. **ProductHunt + OMR Reviews + Capterra DE / GetApp DE** are deferred per your choice. Re-evaluate at day 14 — once indexation is healthy, those listings stop being premature.

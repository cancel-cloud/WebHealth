# GlitchTip Error Handling Full Rollout

Date: 2026-03-11

## Scope

Ship GlitchTip-backed monitoring across `apps/web`, preserve the existing safe public API error contract, and migrate all client-side JSON API calls in `apps/web` onto one shared request/error layer in a single deploy.

## Delivered

1. Monitoring bootstrap
   - Added `@sentry/nextjs` to `apps/web`.
   - Added `instrumentation.ts`, `instrumentation-client.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`.
   - Wrapped `apps/web/next.config.ts` with `withSentryConfig(...)`.
   - Added `src/app/global-error.tsx` and updated `src/app/error.tsx` to capture fatal render failures.
   - Updated `src/lib/server/route-security.ts` to report unexpected route-handler exceptions while still returning sanitized public error payloads.

2. Shared client error/request layer
   - Added `src/lib/client/app-error.ts`.
   - Added `src/lib/client/report-error.ts`.
   - Added `src/lib/client/api.ts` with `requestJson()` and `requestJsonWith()`.
   - Added tests for handled error normalization, reporting suppression, invalid JSON, empty bodies, and network failures.

3. Full client-side JSON fetch migration
   - Migrated user-facing client components in dashboard, reports, properties, settings, feedback, and shared UI.
   - Migrated admin client surfaces that issue JSON requests.
   - Left server-component admin page loaders unchanged by design.

4. Runtime/documentation updates
   - Updated `.env.example` and `apps/web/.env.example` with `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ENVIRONMENT`, and `SENTRY_RELEASE`.
   - Updated `CLAUDE.md` with the localcan HTTPS note for browser auth and GlitchTip verification in dev.

## Verification

- Passed:
  - `pnpm --filter @webhealth/web exec tsx --test src/lib/client/app-error.test.ts src/lib/client/report-error.test.ts src/lib/client/api.test.ts`
  - `pnpm --filter @webhealth/web exec tsx --test 'src/app/(settings)/settings/settings-page.logic.test.ts' 'src/app/reports/[id]/sections/get-details-button.logic.test.ts' 'src/app/reports/[id]/scheduled-report-actions.logic.test.ts' 'src/app/(app)/dashboard/onboarding-modal.logic.test.ts'`
  - `pnpm --filter @webhealth/web exec eslint next.config.ts instrumentation.ts instrumentation-client.ts sentry.server.config.ts sentry.edge.config.ts 'src/app/error.tsx' 'src/app/global-error.tsx' 'src/lib/server/route-security.ts' 'src/lib/client/app-error.ts' 'src/lib/client/api.ts' 'src/lib/client/report-error.ts' 'src/lib/client/app-error.test.ts' 'src/lib/client/api.test.ts' 'src/lib/client/report-error.test.ts' 'src/components/app-sidebar.tsx' 'src/components/feature-request-modal.tsx' 'src/app/(settings)/settings/page.tsx' 'src/app/(app)/dashboard/new-report-dialog.tsx' 'src/app/(app)/dashboard/onboarding-modal.tsx' 'src/app/(app)/dashboard/reports-table.tsx' 'src/app/(app)/dashboard/sync-button.tsx' 'src/app/(app)/properties/page.tsx' 'src/app/(app)/reports/page.tsx' 'src/app/reports/[id]/report-actions.tsx' 'src/app/reports/[id]/report-live-status.tsx' 'src/app/reports/[id]/scheduled-report-actions.tsx' 'src/app/reports/[id]/sections/get-details-button.tsx' 'src/app/(app)/admin/syncing/sync-sheet.tsx' 'src/app/(app)/admin/feature-flags/flags-table.tsx' 'src/app/(app)/admin/feature-flags/flag-detail-sheet.tsx' 'src/app/(app)/admin/ai-report-settings/settings-form.tsx' 'src/app/(app)/admin/global-settings/settings-form.tsx' 'src/app/(app)/admin/users/user-detail-sheet.tsx' 'src/app/(app)/admin/feedback/feedback-inbox.tsx' 'src/app/(app)/admin/logs/logs-table.tsx' 'src/app/(app)/admin/ai-report-debug/debug-console.tsx'`
  - `pnpm --filter @webhealth/web build`

- Build note:
  - The local repo requires non-empty env configuration during `next build`. Verification used stubbed values for DB, auth, OpenAI, Stripe, and GlitchTip envs so the build could validate the code path without production secrets.

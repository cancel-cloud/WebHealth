# TODO — Placeholder / Dummy Data Tracker

This file tracks every place in the app that currently shows hardcoded or dummy data,
so real implementations are easy to find and prioritise.

Search for a specific marker: `grep -r "TODO\[" src/`

---

## Settings Page (`src/app/(app)/settings/page.tsx`)

| # | Feature | Marker | Notes |
|---|---------|--------|-------|
| 1 | Notification toggles | `// TODO[notifications]` | ~~UI state only~~ **Persisted to DB via `user_settings` table** |
| 2 | Billing Preferences toggle | `// TODO[billing-prefs]` | Saved to DB — email sending not yet implemented |
| 3 | Usage / usage limit progress bar | `// TODO[usage]` | Hardcoded 100% remaining and fake reset timer |
| 4 | Keyboard Shortcuts list | `// TODO[kbd-shortcuts]` | Hardcoded shortcuts — not wired to real keybindings |
| 5 | View Devices | `// TODO[devices]` | No API — shows "Coming soon" toast |
| 6 | Delete Account dialog | `// TODO[delete-account]` | Logs warning and shows toast — no real deletion |
| 7 | Disconnect Google | `// TODO[disconnect-google]` | Shows "coming soon" toast — no OAuth revocation |
| 8 | Contact Us cards — all hrefs | `// TODO[contact-links]` | All `href="#"` placeholders |
| 10 | Plan tier badge | `// TODO[plan-tier]` | Hardcoded "Free Plan" — not read from DB |
| 11 | Upgrade buttons | `// TODO[upgrade-flow]` | Disabled buttons — no Stripe / payment flow |
| 12 | Manage Billing & Invoices button | `// TODO[billing-portal]` | Disabled — no Stripe customer portal integration |

---

| 13 | Weekly digest scheduler (cron job, every 7 days) | `// TODO[notification-scheduler]` | No scheduler configured |
| 14 | Email delivery service | `// TODO[email-service]` | No provider configured (Resend / Postmark) |

---

## Dashboard (`src/app/(app)/dashboard/page.tsx`)

| # | Feature | Marker | Notes |
|---|---------|--------|-------|
| 9 | Reports Generated count | `// TODO[report-count]` | Hardcoded to `0` — not queried from DB |

---

## How to use

To grep all markers at once:
```bash
grep -r "TODO\[" src/
```

To find a specific feature, e.g. usage:
```bash
grep -r "TODO\[usage\]" src/
```

---

## Fresh scan (2026-03-04)

Additional unfinished or hardcoded items found in code:

1. Account deletion is still a stub (warn + toast), no real deletion flow.
   `apps/web/src/app/(settings)/settings/page.tsx` (see `TODO[delete-account]`)
2. Device management is a placeholder ("Coming soon"), no API wired.
   `apps/web/src/app/(settings)/settings/page.tsx` (see `TODO[devices]`)
3. Plan tier badge is hardcoded to `Free Plan`.
   `apps/web/src/app/(settings)/settings/page.tsx` (see `TODO[plan-tier]`)
4. Usage card is hardcoded (`100% remaining`, static reset timer).
   `apps/web/src/app/(settings)/settings/page.tsx` (see `TODO[usage]`)
5. Keyboard shortcut list is static, not connected to real bindings.
   `apps/web/src/app/(settings)/settings/page.tsx` (see `TODO[kbd-shortcuts]`)
6. Billing portal button is disabled (no Stripe customer portal flow).
   `apps/web/src/app/(settings)/settings/page.tsx` (see `TODO[billing-portal]`)
7. Upgrade buttons are disabled (no payment/upgrade action).
   `apps/web/src/app/(settings)/settings/page.tsx` (see `TODO[upgrade-flow]`)
8. Billing preference stores toggle, but receipt email delivery is not implemented.
   `apps/web/src/app/(settings)/settings/page.tsx` (see `TODO[billing-prefs]`)
9. Notification delivery infrastructure is incomplete (provider + scheduler missing).
   `apps/web/src/app/(settings)/settings/page.tsx` (see `TODO[email-service]`, `TODO[notification-scheduler]`)
10. Delete dialog cancel button uses a no-op click handler (`onClick={() => {}}`).
    `apps/web/src/app/(settings)/settings/page.tsx`
11. Contact links still contain placeholder hrefs (`"#"`) for Privacy/Terms.
    `apps/web/src/app/(settings)/settings/page.tsx`
12. Plan page uses fully hardcoded plan/pricing data and no real upgrade handler.
    `apps/web/src/app/(app)/settings/plan/page.tsx`
13. Dashboard "Sync Status" text (`Up to date`) is static UI, not live-calculated.
    `apps/web/src/app/(app)/dashboard/page.tsx`
14. Report status polling behavior is hardcoded (`MAX_POLLS = 60`, `5000ms` interval).
    `apps/web/src/app/(app)/dashboard/new-report-dialog.tsx`
15. Several localhost development defaults are hardcoded in auth/dev paths.
    `packages/shared/src/lib/auth.ts`, `scripts/debug-sync.mjs`, `apps/worker/src/artifact-server.ts`

Note: Existing item `TODO[report-count]` in this file appears stale. Current dashboard code now fetches report count from DB in `apps/web/src/app/(app)/dashboard/page.tsx`.


JAN FINDINGS:
1. when a property is only a GA4 property, it says that it will only generate the xlsx file but no report is generated.
   -> report should be generated only with notice that GSC is missing, xlsx should also be generated
   -> rep_L3... was the report that is only had GA4 data
2. Xlsx file cant be opened right now, MacOs says its damaged


switchting in der tabelle setzt den button wieder auf get details, nicht view, wenn sie schon existieren
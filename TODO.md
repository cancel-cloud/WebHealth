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

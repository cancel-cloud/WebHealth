# How to Run Locally on macOS

This guide runs the full WebHealth app locally on a Mac, including the new report queue/worker flow.

## Prerequisites

- Node.js 20+ (recommended)
- `npm` (works with this repo; `pnpm` is also possible if you prefer)
- PostgreSQL (local install or Docker)
- Google OAuth credentials (for Google Search Console / GA4 sync features)
- OpenAI API key (for AI report features)

Optional but useful:

- `psql` CLI for checking the local DB
- Docker Desktop (if you do not want a native Postgres install)

## 1) Clone and install

```bash
git clone <your-repo-url>
cd WebHealth
npm install
```

## 2) Environment setup

Copy and edit:

```bash
cp .env.example .env.local
```

Minimum required values (see your existing local file for the full set):

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_STATE_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (for example `gpt-5-mini`)

Optional for the new worker/artifact/cost features:

- `REPORT_ARTIFACTS_DIR` (default: `./artifacts`)
- `REPORT_WORKER_MAX_ACTIVE_GLOBAL` (default: `2`)
- `REPORT_WORKER_MAX_ACTIVE_PER_TEAM` (default: `1`)
- `REPORT_WORKER_LEASE_SECONDS` (default: `45`)
- `REPORT_WORKER_HEARTBEAT_SECONDS` (default: `10`)
- `REPORT_WORKER_POLL_MS` (default: `3000`)
- `REPORT_AI_COST_CAP_USD` (default: `1`)
- `REPORT_OPENAI_POLL_INTERVAL_MS` (default: `3000`)
- `REPORT_OPENAI_POLL_TIMEOUT_MS` (default: `360000`)
- `OPENAI_ADMIN_KEY` (required only for billed cost reconciliation via `/v1/organization/costs`)

## 3) Start Postgres

Native Postgres or Docker both work.

Example with Docker:

```bash
docker run --name webhealth-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=webaudit \
  -p 5432:5432 \
  -d postgres:16
```

## 4) Run DB migrations (Drizzle)

If you apply SQL migrations directly:

```bash
# Example (adjust host/user/db as needed)
psql "$DATABASE_URL" -f drizzle/0000_faithful_johnny_blaze.sql
psql "$DATABASE_URL" -f drizzle/0001_free_wild_child.sql
psql "$DATABASE_URL" -f drizzle/0002_tiny_metric_cache.sql
psql "$DATABASE_URL" -f drizzle/0003_worried_maelstrom.sql
psql "$DATABASE_URL" -f drizzle/0004_batch_metrics.sql
psql "$DATABASE_URL" -f drizzle/0005_hardened_report_queue.sql
psql "$DATABASE_URL" -f drizzle/0006_fancy_rawhide_kid.sql
psql "$DATABASE_URL" -f drizzle/0007_report_language_setting.sql
```

If you already use a Drizzle migration runner in your setup, use that instead.

## 5) Start the app (terminal 1)

```bash
npm run dev
```

## 6) Start the report worker loop (terminal 2, optional but recommended)

The new queue-based report flow requires a worker to process queued jobs.

```bash
npm run worker:reports
```

Run a single tick for debugging:

```bash
npm run worker:reports:once
```

## 7) (Optional) Reconcile billed OpenAI costs

Requires `OPENAI_ADMIN_KEY`.

```bash
npm run openai:reconcile-costs -- 7
```

This fetches daily cost buckets from OpenAI and stores them in `openai_daily_costs`.

## Common Issues

## Missing env vars

Symptoms:

- auth routes fail
- Google sync fails
- AI calls fail
- worker crashes on startup

Fix:

- verify `.env.local` exists
- confirm `BETTER_AUTH_URL`, `DATABASE_URL`, Google, and OpenAI keys are present
- restart the dev server after env changes

## Database connection errors

Symptoms:

- `ECONNREFUSED` / postgres connection errors

Fix:

- confirm Postgres is running
- check `DATABASE_URL`
- verify DB name/user/password

## Google OAuth redirect mismatch

Symptoms:

- Google login fails with redirect URI error

Fix:

- ensure `BETTER_AUTH_URL` matches your local dev hostname exactly
- add that exact auth callback URL in the Google Cloud OAuth config

## Local auth base URL mismatch

Symptoms:

- sessions behave inconsistently or callback URLs look wrong

Fix:

- align `BETTER_AUTH_URL` with the URL you actually use in the browser

## Artifact directory permission issues

Symptoms:

- XLSX rendering succeeds but download fails / file missing

Fix:

- set `REPORT_ARTIFACTS_DIR` to a writable directory
- verify the folder exists and your user can write to it

## Minimal Mode (What works without all external services)

Works with only Next.js + Postgres:

- auth/UI shell (depending on your local auth setup)
- admin pages
- queue tables / debug console shell
- job enqueue / retry endpoints
- local artifact storage plumbing

Requires Google credentials:

- GSC/GA4 sync
- full report metric collection

Requires OpenAI API key:

- AI report generation
- AI cost estimates / request tracing

Requires OpenAI admin key (`OPENAI_ADMIN_KEY`):

- authoritative billed spend reconciliation via the Costs API

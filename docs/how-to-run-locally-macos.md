# How to Run Locally on macOS

This runbook starts the split architecture locally:

- `apps/web` (Next.js UI + short API routes)
- `apps/worker` (long-running queue worker)
- Neon/Postgres as shared backend state

`pnpm` is required and used everywhere in this repository.

## Prerequisites

- Node.js 20+
- Corepack enabled (`corepack enable`)
- `pnpm` (version pinned by root `packageManager`)
- Postgres/Neon database access
- Google OAuth credentials
- OpenAI API key

Optional:

- `psql`
- Docker Desktop (if you want local Postgres container)

## 1) Install dependencies

```bash
git clone <your-repo-url>
cd WebHealth
corepack enable
pnpm install
```

## 2) Configure environment files

Create local env files from placeholders:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env.local
```

Required rules:

- `DATABASE_URL` must be Neon pooled host (`-pooler`) and include `sslmode=require`
- `DIRECT_DATABASE_URL` must be direct Neon host (no `-pooler`) and include `sslmode=require`
- Runtime (`web` + `worker`) uses `DATABASE_URL`
- Migrations use `DIRECT_DATABASE_URL` (worker startup can derive direct host from pooled `DATABASE_URL` if not set)

## 3) (Optional) Run database migrations manually

From repo root:

```bash
pnpm db:migrate
```

Worker startup already runs migrations before processing jobs, so this step is optional.
Use it when you want to apply schema changes without starting the worker.

Optional for schema sync during development:

```bash
pnpm db:push
```

## 4) Start web and worker

Terminal 1 (web):

```bash
pnpm dev
```

Terminal 2 (worker):

```bash
pnpm worker
```

Single worker tick for debugging:

```bash
pnpm worker:once
```

## 5) Basic local verification

From repo root:

```bash
pnpm --filter @webhealth/web build
pnpm --filter @webhealth/web exec tsc --noEmit
pnpm --filter @webhealth/worker exec tsc --noEmit
```

Queue flow smoke test:

1. Start web + worker.
2. Create or retry a report from UI.
3. Confirm report status transitions: `queued` -> `processing` -> `complete|failed`.
4. Verify job/event rows in DB (`report_jobs`, `report_job_events`).

Legacy process endpoint guard:

```bash
curl -i -X POST http://localhost:3000/api/reports/<reportId>/process
```

Expected status: `410 Gone`.

## Common issues

## Wrong Neon URL type

Symptoms:

- Worker/web abort on startup with DB config errors

Fix:

- Ensure `DATABASE_URL` has `-pooler` and `sslmode=require`
- Ensure `DIRECT_DATABASE_URL` has no `-pooler` and has `sslmode=require`

## OAuth redirect mismatch

Symptoms:

- Google login/connect fails

Fix:

- Align `BETTER_AUTH_URL` with your local URL
- Update Google OAuth redirect URIs accordingly

## Worker starts but no jobs get processed

Symptoms:

- Reports stay `queued`

Fix:

- Confirm worker process is running
- Confirm worker has DB + Google + OpenAI envs
- Check `report_job_events` and worker logs for claim/lease errors

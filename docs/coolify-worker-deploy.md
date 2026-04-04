# Coolify Worker Deployment Guide (WebHealth)

This guide explains how to run `apps/worker` in Coolify while the database stack lives in the separate self-hosted Postgres Compose deployment.

## 1) Target architecture

- Web app: Vercel
- Database: self-hosted PostgreSQL + PgBouncer on Hetzner
- Worker: Coolify application resource

Worker process:

```bash
node dist/apps/worker/src/main.js
```

## 2) Coolify worker setup

1. Create a new application resource from this repo.
2. Use **Dockerfile**.
3. Keep **Base Directory** as `/`.
4. Set **Dockerfile Location** to `apps/worker/Dockerfile`.
5. Do not add a separate build or start command. The Docker image installs production dependencies from `dist/package.json` and starts the compiled worker bundle directly.

Before committing, pushing, or finishing any worker refactor or feature task, rebuild and verify the committed runtime bundle:

```bash
pnpm worker:build-dist
pnpm worker:verify-dist
```

## 3) Required env vars

- `DATABASE_URL=postgresql://<runtime-user>:<pass>@db.webhealth.devbrew.dev:6432/webhealth?sslmode=require`
- `DIRECT_DATABASE_URL=postgresql://<direct-user>:<pass>@<private-host-or-predefined-network-name>:5432/webhealth?sslmode=require`
- `SENTRY_DSN`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ARTIFACT_TOKEN_SECRET`
- `REPORT_ARTIFACTS_DIR`
- `OAUTH_TOKEN_ENCRYPTION_KEY`
- `REPORT_WORKER_MAX_JOB_RUNTIME_MS`
- `REPORT_WORKER_WATCHDOG_INTERVAL_MS`
- `WORKER_READY_STALE_AFTER_MS`

## 4) Direct Postgres access

The worker must use the private direct Postgres endpoint for startup migrations and `LISTEN/NOTIFY`.

Use one of these:

- the full Postgres service name exposed through Coolify's predefined network
- a private host/IP on the Hetzner network
- an SSH tunnel during admin or migration work

Do not point `DIRECT_DATABASE_URL` at PgBouncer.

## 5) Artifact server

The worker artifact server still exposes `/health` and `/ready` on `WORKER_HTTP_PORT` when `ARTIFACT_TOKEN_SECRET` is set.

Set `WORKER_ARTIFACT_URL` on the web app to the worker's reachable artifact URL and keep `ARTIFACT_TOKEN_SECRET` identical across web and worker.

## 6) Verification

1. Rebuild the runtime bundle and commit the `dist/` changes.
2. Deploy the worker.
3. Confirm logs show the DB migration bootstrap, artifact server readiness, and worker loop start.
4. Check the worker health endpoint returns ready on `/ready`.
5. Create a report from the web app.
6. Verify job state transitions, deferred crawl refresh behavior, and artifact downloads.

# Coolify Worker Deployment Guide (WebHealth)

This guide explains how to run `apps/worker` in Coolify while the database stack lives in the separate self-hosted Postgres Compose deployment.

## 1) Target architecture

- Web app: Vercel
- Database: self-hosted PostgreSQL + PgBouncer on Hetzner
- Worker: Coolify application resource

Worker process:

```bash
pnpm --filter @webhealth/worker start
```

## 2) Coolify worker setup

1. Create a new application resource from this repo.
2. Use **Nixpacks**.
3. Keep **Base Directory** as `/`.
4. Start command:

```bash
pnpm --filter @webhealth/worker start
```

Recommended build guard:

```bash
pnpm --filter @webhealth/worker exec tsc --noEmit
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

## 4) Direct Postgres access

The worker must use the private direct Postgres endpoint for startup migrations and `LISTEN/NOTIFY`.

Use one of these:

- the full Postgres service name exposed through Coolify's predefined network
- a private host/IP on the Hetzner network
- an SSH tunnel during admin or migration work

Do not point `DIRECT_DATABASE_URL` at PgBouncer.

## 5) Artifact server

The worker artifact server still exposes `/health` on `WORKER_HTTP_PORT` when `ARTIFACT_TOKEN_SECRET` is set.

Set `WORKER_ARTIFACT_URL` on the web app to the worker's reachable artifact URL and keep `ARTIFACT_TOKEN_SECRET` identical across web and worker.

## 6) Verification

1. Deploy the worker.
2. Confirm logs show the worker loop start and DB migration bootstrap.
3. Create a report from the web app.
4. Verify job state transitions and artifact downloads.

# Coolify Worker Deployment Guide (WebHealth)

This guide explains how to run the backend worker (`apps/worker`) in Coolify using the GUI.

It complements [deploy-runbook.md](./deploy-runbook.md), which remains the canonical full-stack deployment checklist.

## 1) Scope and Architecture

Target architecture:

- Web app: Vercel (`apps/web`)
- Database: Neon Postgres
- Worker: Coolify application resource (this guide)

Worker process started by Coolify:

```bash
pnpm --filter @webhealth/worker start
```

## 2) Prerequisites

Before creating the worker resource in Coolify:

1. Ensure your server is connected in Coolify.
2. Create/select a destination for that server.
3. Ensure the repository is accessible from Coolify (public repo, GitHub App, or deploy key).
4. Keep using `pnpm` and the existing monorepo layout.

## 3) Create the Worker Resource in Coolify

1. Open your project in Coolify.
2. Click **Create New Resource**.
3. Select your repository source (public/private Git).
4. Set **Build Pack** to **Nixpacks**.
5. Configure:
- **Branch**: your deploy branch.
- **Base Directory**: `/` (repo root).
- **Port**: leave the default unless your UI requires a value. This worker is not exposed via a domain.
6. Continue to deployment settings.

## 4) Commands for This Monorepo

In the Nixpacks build section, set explicit commands so only worker runtime behavior is deployed:

- Install command:

```bash
pnpm install --frozen-lockfile
```

- Build command (optional but recommended as guard):

```bash
pnpm --filter @webhealth/worker exec tsc --noEmit
```

- Start command:

```bash
pnpm --filter @webhealth/worker start
```

If Coolify does not apply command overrides as expected in your version, add a `nixpacks.toml` in repo root and define the commands there.

## 5) Environment Variables

Set these in the Coolify **Environment Variables** tab.

Required for worker:

- `DATABASE_URL` (Neon pooled URL with `-pooler` and `sslmode=require`)
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`

Common optional vars:

- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `OPENAI_PROJECT`
- `OPENAI_ORG`
- `DATABASE_POOL_MAX`
- `DATABASE_POOL_IDLE_TIMEOUT`
- `DATABASE_POOL_CONNECT_TIMEOUT`
- `REPORT_WORKER_POLL_MS`
- `REPORT_WORKER_LEASE_SECONDS`
- `REPORT_WORKER_HEARTBEAT_SECONDS`
- `REPORT_WORKER_MAX_ACTIVE_GLOBAL`
- `REPORT_WORKER_MAX_ACTIVE_PER_TEAM`
- `REPORT_ARTIFACTS_DIR`
- `REPORT_AI_COST_CAP_USD`
- `REPORT_OPENAI_POLL_INTERVAL_MS`
- `REPORT_OPENAI_POLL_TIMEOUT_MS`

## 6) Networking and Health Checks

This worker is a background process, not an HTTP service.

- Do not assign a public domain to this resource.
- Prefer disabling application health checks for this worker unless you intentionally add a process-specific container health check.
- If health checks are enabled via UI checks, Coolify expects a network check path and container support for `curl` or `wget`.

## 7) Optional Persistent Storage for Artifacts

If you want artifacts to survive redeploys/restarts:

1. Add persistent storage in Coolify.
2. Set destination path to match your worker artifacts directory (for example `/app/artifacts`).
3. Set `REPORT_ARTIFACTS_DIR=/app/artifacts`.

Note: Coolify container base path is `/app`.

## 8) Deploy and Verify

After first deploy:

1. Open deployment logs and confirm worker boot line:

```text
[report-worker] starting loop...
```

2. Create a report job from the web app.
3. Verify worker logs show claim/processing activity.
4. Verify job status transitions in DB/UI (`queued` -> `complete` or `failed`).
5. Verify `POST /api/reports/[id]/process` returns `410` after queue-based processing takes over.

## 9) Rollback

If a deployment breaks worker processing:

1. In Coolify, redeploy the previous known-good commit.
2. Confirm logs return to normal worker loop behavior.
3. Re-test a single report job end-to-end.

## 10) Source References (Coolify Docs)

- https://coolify.io/docs/applications/build-packs/nixpacks.md
- https://coolify.io/docs/applications/build-packs/dockerfile.md
- https://coolify.io/docs/knowledge-base/environment-variables.md
- https://coolify.io/docs/knowledge-base/health-checks.md
- https://coolify.io/docs/knowledge-base/persistent-storage.md
- https://coolify.io/docs/knowledge-base/destinations/create.md

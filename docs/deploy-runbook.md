# Deploy Runbook (Vercel + Neon + Worker VPS)

This is the canonical deployment checklist for the split architecture:

- Web: `apps/web` on Vercel
- Database: Neon Postgres
- Worker: `apps/worker` on VPS (for example Hetzner)

GlitchTip monitoring setup is documented separately in `docs/glitchtip.md`.

`pnpm` is required across all environments.

## 0) Pre-deploy checks

From repo root:

```bash
pnpm install
pnpm --filter @webhealth/web build
pnpm --filter @webhealth/web exec tsc --noEmit
pnpm --filter @webhealth/worker exec tsc --noEmit
pnpm worker:once
```

Optional: apply migrations manually before deploy:

```bash
pnpm db:migrate
```

`apps/worker` now runs startup migrations automatically before entering its loop.

## 1) Neon configuration

You must keep both URLs:

- `DATABASE_URL` = pooled Neon runtime URL (`-pooler`, `sslmode=require`)
- `DIRECT_DATABASE_URL` = direct Neon migration URL (no `-pooler`, `sslmode=require`)

Example patterns:

```bash
DATABASE_URL=postgresql://<user>:<pass>@<project>-pooler.<region>.neon.tech/<db>?sslmode=require
DIRECT_DATABASE_URL=postgresql://<user>:<pass>@<project>.<region>.neon.tech/<db>?sslmode=require
```

## 2) Deploy web to Vercel (`apps/web`)

Vercel project settings:

1. Root Directory: `apps/web`
2. Node.js version: `20.x` (or newer compatible version)
3. Install Command: `pnpm install --frozen-lockfile`
4. Build Command: `pnpm build`
5. Start Command: `pnpm start` (used for non-serverless environments / previews as needed)

Required env vars in Vercel project:

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_STATE_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `DATABASE_POOL_MAX`
- `DATABASE_POOL_IDLE_TIMEOUT`
- `DATABASE_POOL_CONNECT_TIMEOUT`

Local sync from Vercel:

```bash
vercel env pull apps/web/.env.local
```

Vercel troubleshooting:

- Symptom: `No Next.js version detected`.
  - Cause: Vercel is not building from `apps/web`.
  - Fix: set Project Root Directory to `apps/web` and redeploy.
- Symptom: Deploy logs show an older commit hash than expected.
  - Cause: deployment not triggered from latest branch head.
  - Fix: verify Production Branch is `main`, then redeploy latest commit.
- Symptom: `ERR_PNPM_OUTDATED_LOCKFILE` during install.
  - Cause: `pnpm-lock.yaml` does not match committed `package.json`.
  - Fix: update lockfile in git (`pnpm install` locally, commit lockfile), keep Vercel install command on `pnpm install --frozen-lockfile`.
- Symptom: download API returns `{"error":"Failed to reach artifact download worker"}`.
  - Cause: Vercel could not connect to `WORKER_ARTIFACT_URL`.
  - Fix: verify the URL is publicly reachable from the internet, prefer HTTPS ingress/domain, and verify `/health`.
- Symptom: download API returns `{"error":"Failed to fetch artifact from worker"}`.
  - Cause: worker returned non-200 for `/artifacts` (for example 400/401/500).
  - Fix: verify `ARTIFACT_TOKEN_SECRET` matches web + worker and inspect worker artifact-server logs.
- Symptom: worker logs show `ENOENT ... stat 'artifacts/reports/...xlsx'` for `/artifacts`.
  - Cause: worker is looking in a relative path while artifacts are mounted elsewhere.
  - Fix: set `REPORT_ARTIFACTS_DIR` to the mounted absolute path (for example `/app/artifacts`), redeploy worker, and regenerate missing XLSX artifacts.

## 3) Deploy worker to VPS

Server bootstrap:

```bash
# install node + corepack + pnpm first
git clone <your-repo-url> /opt/webhealth
cd /opt/webhealth
corepack enable
pnpm install --frozen-lockfile
```

Create env file (example path `/etc/webhealth/worker.env`) with at least:

- `DATABASE_URL`
- `DIRECT_DATABASE_URL` (recommended for explicit direct-host migrations)
- `SENTRY_DSN` (recommended so worker startup/runtime crashes reach GlitchTip)
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `REPORT_ARTIFACTS_DIR` (absolute container path for artifacts, for example `/app/artifacts`)
- `ARTIFACT_TOKEN_SECRET`
- `OAUTH_TOKEN_ENCRYPTION_KEY`
- optional `SENTRY_ENVIRONMENT` / `SENTRY_RELEASE`
- optional worker tuning vars from `apps/worker/.env.example`

Artifact storage path requirements:

- Do not use a relative path like `./artifacts` in production containers.
- Use an absolute path that matches your mounted volume destination.
- Coolify example: if the persistent volume destination is `/app/artifacts`, set `REPORT_ARTIFACTS_DIR=/app/artifacts`.

systemd unit example (`/etc/systemd/system/webhealth-worker.service`):

```ini
[Unit]
Description=WebHealth Report Worker
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/webhealth
EnvironmentFile=/etc/webhealth/worker.env
ExecStart=/usr/bin/pnpm --filter @webhealth/worker start
Restart=always
RestartSec=5
User=webhealth

[Install]
WantedBy=multi-user.target
```

Enable/start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable webhealth-worker
sudo systemctl start webhealth-worker
sudo systemctl status webhealth-worker
```

## 4) Post-deploy verification

1. Open web app and create a report.
2. Confirm DB entry exists in `report_jobs` with status flow.
3. Confirm worker logs show claim and processing lifecycle.
4. Confirm report in UI changes from `queued` to `complete|failed`.
5. Confirm `POST /api/reports/[id]/process` returns `410`.

## 5) Rollback strategy

1. Web rollback: redeploy previous Vercel deployment.
2. Worker rollback: checkout previous commit/tag on VPS and restart systemd.
3. Database rollback: apply backward-safe migration strategy (never edit historical migration files already applied).

# Deploy Runbook (Vercel + Neon + Worker VPS)

This is the canonical deployment checklist for the split architecture:

- Web: `apps/web` on Vercel
- Database: Neon Postgres
- Worker: `apps/worker` on VPS (for example Hetzner)

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

Apply migrations:

```bash
pnpm db:migrate
```

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
3. Install Command: `pnpm install`
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
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- optional worker tuning vars from `apps/worker/.env.example`

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

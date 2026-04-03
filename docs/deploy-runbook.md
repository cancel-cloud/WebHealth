# Deploy Runbook (Vercel + Self-Hosted Postgres + Worker)

This is the canonical deployment checklist for the split architecture:

- Web: `apps/web` on Vercel
- Database stack: `infra/self-hosted-postgres` on Hetzner via Coolify Docker Compose
- Monitoring stack: `infra/monitoring` on Hetzner via Coolify Docker Compose
- Worker: `apps/worker` on Hetzner

GlitchTip monitoring remains documented in [docs/glitchtip.md](/Users/cancelcloud/Developer/DevBrew/WebHealth/docs/glitchtip.md).

## 0) Pre-deploy checks

From repo root:

```bash
pnpm install --frozen-lockfile
pnpm --filter @webhealth/shared exec tsx --test src/db/url-guards.test.ts src/db/worker-db-bootstrap.test.ts
pnpm --filter @webhealth/worker exec tsx --test src/load-env.test.ts src/runtime-state.test.ts src/runtime-watchdog.test.ts src/artifact-server.test.ts
pnpm --filter @webhealth/worker exec tsc --noEmit
pnpm worker:verify-dist
pnpm --filter @webhealth/web exec eslint src/app/'(marketing)'/legal/legal-dictionaries.en.ts src/app/'(marketing)'/legal/legal-dictionaries.de.ts
pnpm worker:once
```

If schema changes are pending, apply them manually with:

```bash
pnpm db:migrate
```

## 1) Deploy the DB stack

1. Copy [infra/self-hosted-postgres/.env.example](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/self-hosted-postgres/.env.example) to `.env` in the same folder.
2. Set all DB role passwords, pgAdmin credentials, and image overrides if needed.
3. In Coolify, add `DB_TLS_CERT_PEM` and `DB_TLS_KEY_PEM` as multiline runtime environment variables for the stack.
   Generate them with:

```bash
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
  -keyout db-tls.key -out db-tls.crt \
  -subj "/CN=db.webhealth.devbrew.dev" \
  -addext "subjectAltName=DNS:db.webhealth.devbrew.dev,IP:178.104.11.44"
```

   Then paste the full PEM contents of `db-tls.crt` into `DB_TLS_CERT_PEM` and `db-tls.key` into `DB_TLS_KEY_PEM`.
4. Deploy [infra/self-hosted-postgres/docker-compose.yml](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/self-hosted-postgres/docker-compose.yml) in Coolify.
5. Publish only:
   - `pgbouncer` on `db.webhealth.devbrew.dev` and port `6432`
   - `pgadmin` on `pgadmin.webhealth.devbrew.dev`
6. Keep direct Postgres private. The stack binds `5432` only on loopback for same-host admin/tunnel use.
7. The default stack now targets PostgreSQL `18.3` via `POSTGRES_BASE_IMAGE=postgres:18.3-bookworm`.
8. If the first initialization ever failed before creating the `webhealth` database and roles, delete the self-hosted Postgres data volume and redeploy before migrating production data.

## 2) Deploy the monitoring stack

1. Copy [infra/monitoring/.env.example](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/monitoring/.env.example) to `.env` in the same folder.
2. Put the monitoring stack on the same Coolify predefined network as the DB stack, or plan to use private hostnames/IPs for the scrape targets.
3. Set `GRAFANA_ADMIN_USER`, `GRAFANA_ADMIN_PASSWORD`, and the Prometheus scrape targets.
4. Point:
   - `PROMETHEUS_POSTGRES_EXPORTER_TARGET` at the DB stack `postgres-exporter` service
   - `PROMETHEUS_NODE_EXPORTER_TARGET` at the DB stack `node-exporter` service
5. Deploy [infra/monitoring/docker-compose.yml](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/monitoring/docker-compose.yml) in Coolify.
6. Publish only:
   - `grafana` on `grafana.devbrew.dev`
7. Keep `prometheus` private.

## 3) Configure Vercel (`apps/web`)

Required env vars:

- `DATABASE_URL` = pooled PgBouncer URL such as `postgresql://<runtime-user>:<pass>@db.webhealth.devbrew.dev:6432/webhealth?sslmode=require`
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
- `WORKER_ARTIFACT_URL`
- `ARTIFACT_TOKEN_SECRET`

Keep Vercel project settings:

1. Root Directory: `apps/web`
2. Install Command: `pnpm install --frozen-lockfile`
3. Build Command: `pnpm build`

## 4) Configure the worker

Set at least:

- `DATABASE_URL` = pooled PgBouncer URL
- `DIRECT_DATABASE_URL` = private direct Postgres URL, usually the Postgres service name on Coolify's predefined network or an SSH tunnel endpoint
- `SENTRY_DSN`
- `BETTER_AUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `REPORT_ARTIFACTS_DIR`
- `ARTIFACT_TOKEN_SECRET`
- `OAUTH_TOKEN_ENCRYPTION_KEY`
- `REPORT_WORKER_MAX_JOB_RUNTIME_MS`
- `REPORT_WORKER_WATCHDOG_INTERVAL_MS`
- `WORKER_READY_STALE_AFTER_MS`

For Coolify worker deployment, follow [docs/coolify-worker-deploy.md](/Users/cancelcloud/Developer/DevBrew/WebHealth/docs/coolify-worker-deploy.md).

## 5) Post-deploy verification

1. Confirm Grafana loads the provisioned Postgres dashboard.
2. Confirm `pgbackrest` has created its stanza and backup metrics files.
3. Open the web app and verify sign-in succeeds.
4. Create a report and confirm the queue lifecycle progresses.
5. Confirm worker logs show `LISTEN/NOTIFY enabled`.
6. Confirm the worker `/ready` endpoint reports healthy queue-loop readiness.
7. Confirm report downloads still work through the worker artifact endpoint.

## 6) Rollback

1. Web rollback: redeploy the previous Vercel deployment.
2. Worker rollback: redeploy the previous worker release or restart the earlier commit.
3. Database rollback: point `DATABASE_URL` and `DIRECT_DATABASE_URL` back to Neon only if the production cutover checklist in [docs/self-hosted-postgres-migration.md](/Users/cancelcloud/Developer/DevBrew/WebHealth/docs/self-hosted-postgres-migration.md) has not irreversibly advanced writes on the new primary.

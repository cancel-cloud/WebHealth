# How to Run Locally on macOS

This runbook starts the split architecture locally:

- `apps/web`
- `apps/worker`
- a TLS-enabled PostgreSQL backend using the same pooled/direct URL contract as production

## Prerequisites

- Node.js 20+
- Corepack enabled
- `pnpm`
- access to a TLS-enabled Postgres database
- Google OAuth credentials
- OpenAI API key

## 1) Install dependencies

```bash
git clone <your-repo-url>
cd WebHealth
corepack enable
pnpm install
```

## 2) Configure env files

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env.local
```

Required rules:

- `DATABASE_URL` points at the pooled runtime endpoint and includes `sslmode=require`
- `DIRECT_DATABASE_URL` points at direct Postgres and includes `sslmode=require`
- runtime uses `DATABASE_URL`
- migrations and `LISTEN/NOTIFY` use `DIRECT_DATABASE_URL`

## 3) Optional manual migrations

```bash
pnpm db:migrate
```

## 4) Start web and worker

Terminal 1:

```bash
pnpm dev
```

Terminal 2:

```bash
pnpm worker
```

## 5) Local verification

```bash
pnpm --filter @webhealth/shared exec tsx --test src/db/url-guards.test.ts src/db/worker-db-bootstrap.test.ts
pnpm --filter @webhealth/worker exec tsx --test src/load-env.test.ts
```

Then:

1. Create a report.
2. Confirm `queued -> processing -> complete|failed`.
3. Verify worker logs show `LISTEN/NOTIFY enabled`.

## Common issues

### Missing TLS on the DB endpoint

Symptoms:

- startup fails with `sslmode=require` config errors or SSL connection failures

Fix:

- ensure both DB URLs terminate TLS
- if you are using the self-hosted stack, set `DB_TLS_CERT_PEM` and `DB_TLS_KEY_PEM` before booting the stack

### Wrong direct endpoint

Symptoms:

- worker starts but startup migrations or `LISTEN/NOTIFY` fail

Fix:

- ensure `DIRECT_DATABASE_URL` points at direct Postgres, not PgBouncer

### OAuth redirect mismatch

Symptoms:

- Google login/connect fails

Fix:

- align `BETTER_AUTH_URL` with your local URL and configured Google redirect URIs

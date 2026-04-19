# Self-Hosted Postgres Migration From Neon

This runbook covers the production migration from Neon to the self-hosted PostgreSQL stack using full downtime and a direct dump/restore cutover.

The target runtime contract after migration is:

- `DATABASE_URL` -> PgBouncer on port `6432`
- `DIRECT_DATABASE_URL` -> direct Postgres on port `5432`

Do not point `DIRECT_DATABASE_URL` at PgBouncer.

## 1) Check the source Postgres version

Before provisioning the target, run on Neon:

```sql
show server_version;
show server_version_num;
```

For this downtime-based `pg_dump`/`pg_restore` migration, the target does not need to match Neon exactly. The stack default is PostgreSQL `18.3` in [infra/self-hosted-postgres/.env.example](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/self-hosted-postgres/.env.example). Keep the source version check as a compatibility sanity check and rollback reference.

## 2) Deploy and validate the target stack

1. Deploy the Compose stack in Coolify.
2. Confirm Postgres, PgBouncer, pgBackRest, and pgAdmin start cleanly.
3. Confirm the target endpoints work:
   - pooled runtime endpoint on `6432`
   - private direct Postgres endpoint on `5432`
4. Confirm TLS is enabled on both URLs.

## 3) Rehearse the migration before production

Before touching production:

1. take a fresh dump from Neon
2. restore it into a disposable or non-production copy of the target
3. verify:
   - Better Auth tables: `user`, `session`, `verification`, `account`
   - queue tables and report tables
   - sign-in works against the restored copy
   - worker can run startup migrations and `LISTEN/NOTIFY`

Use the same commands planned for production so the real cutover is boring.

## 4) Start the production maintenance window

Because this migration uses full downtime, stop all application writes before exporting data.

1. stop the worker
2. disable or shut down the web app
3. confirm there is no remaining app traffic hitting Neon

At this point, no new rows should be created in Neon.

## 5) Export from Neon

Use the direct Neon URL for the export, not the pooled runtime URL.

Recommended dump format:

```bash
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --dbname="$NEON_DIRECT_DATABASE_URL" \
  --file=webhealth.dump
```

If you want a compressed plain SQL dump instead, use:

```bash
pg_dump \
  --no-owner \
  --no-privileges \
  --dbname="$NEON_DIRECT_DATABASE_URL" \
  | gzip > webhealth.sql.gz
```

Use the custom-format dump unless you have a specific reason not to.

## 6) Restore into the new direct Postgres endpoint

Restore into the self-hosted target using `DIRECT_DATABASE_URL`.

Recommended restore command:

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --jobs=4 \
  --dbname="$TARGET_DIRECT_DATABASE_URL" \
  webhealth.dump
```

If you used the plain SQL dump:

```bash
gunzip -c webhealth.sql.gz | psql "$TARGET_DIRECT_DATABASE_URL"
```

## 7) Run schema verification and migrations

After restore:

```bash
pnpm db:push
```

This ensures the target schema matches the current repo state even if the dump came from a slightly older production schema. We use `drizzle-kit push` (not `migrate`) because the DB has no `__drizzle_migrations` tracking table.

## 8) Validate the restored database

Before pointing app traffic at the new stack, check:

1. row counts on critical tables
2. Better Auth tables are populated
3. queue tables and report tables look correct
4. the worker can connect to `DIRECT_DATABASE_URL`
5. the web app can connect to PgBouncer through `DATABASE_URL`

Useful SQL checks:

```sql
select count(*) from "user";
select count(*) from session;
select count(*) from verification;
select count(*) from report_jobs;
select count(*) from reports;
```

## 9) Switch application envs

Update:

- Vercel `DATABASE_URL` -> pooled PgBouncer URL on `6432`
- worker `DATABASE_URL` -> pooled PgBouncer URL on `6432`
- worker `DIRECT_DATABASE_URL` -> private direct Postgres URL on `5432`

Then redeploy or restart the web app and worker.

## 10) Bring traffic back

After envs are switched:

1. bring the web app back online
2. restart the worker
3. run smoke tests:
   - sign-in
   - report creation
   - worker claim/process lifecycle
   - XLSX download

## 11) Rollback

Keep Neon intact until the new stack is proven stable.

Rollback path:

1. stop the worker again
2. disable web traffic again
3. point envs back to Neon
4. redeploy web and worker
5. reopen traffic

Do not decommission Neon until:

- multiple successful backups have run on the new stack
- at least one restore drill has succeeded
- production traffic has remained stable on the new primary

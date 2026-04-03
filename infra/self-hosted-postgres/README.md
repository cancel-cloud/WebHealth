# Self-Hosted Postgres Stack

This stack replaces Neon with a Coolify-friendly Docker Compose deployment on Hetzner while preserving WebHealth's split DB contract:

- `DATABASE_URL`: pooled runtime endpoint through PgBouncer on port `6432`
- `DIRECT_DATABASE_URL`: private direct Postgres endpoint for Drizzle migrations, worker startup migrations, and `LISTEN/NOTIFY`

## Included services

- `postgres`: primary database with `pg_stat_statements`, logical replication, WAL archiving, and local PITR support
- `pgbouncer`: the only public DB endpoint for Vercel/app runtime traffic
- `pgbackrest`: headless backup loop for nightly full backups, 6-hour differential backups, and WAL archive management
- `postgres-exporter`, `node-exporter`: exporter endpoints for the separate monitoring stack
- `pgadmin`: browser-based admin UI for occasional inspection and debugging

## Deploy in Coolify

1. Copy `.env.example` to `.env` and replace every placeholder with production secrets.
2. In Coolify, add `DB_TLS_CERT_PEM` and `DB_TLS_KEY_PEM` as multiline runtime environment variables. The containers will write `server.crt` and `server.key` on startup.
3. In Coolify, create a Docker Compose resource that uses [`docker-compose.yml`](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/self-hosted-postgres/docker-compose.yml).
4. Publish:
   - `pgbouncer` on `db.webhealth.devbrew.dev` and port `6432`
   - `pgadmin` on `pgadmin.webhealth.devbrew.dev`
5. Keep `postgres`, `pgbackrest`, and the exporter services unexposed to the public internet.
6. Deploy the separate monitoring stack from [infra/monitoring](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/monitoring) for Prometheus and Grafana.

## Runtime env mapping

After the stack is live, the app-side envs should look like:

```bash
DATABASE_URL=postgresql://<runtime-user>:<pass>@db.webhealth.devbrew.dev:6432/webhealth?sslmode=require
DIRECT_DATABASE_URL=postgresql://<direct-user>:<pass>@<private-host-or-predefined-network-name>:5432/webhealth?sslmode=require
```

Use SSH tunneling or pgAdmin for direct/private access. Do not publish the direct Postgres port.

In Coolify, set `DB_TLS_CERT_PEM` and `DB_TLS_KEY_PEM` in Normal View with `Multiline` enabled. If your key contains `$`, also enable `Literal`.

## Day-2 operations

- Backup status: check the Grafana dashboard in the separate monitoring stack
- Manual backup:

```bash
docker compose exec pgbackrest pgbackrest --stanza=webhealth backup --type=full
```

- Backup inventory:

```bash
docker compose exec pgbackrest pgbackrest --stanza=webhealth info
```

- Restore rehearsal:

```bash
docker compose run --rm postgres bash -lc 'rm -rf "$PGDATA"/* && pgbackrest --stanza=webhealth --delta restore'
```

## Migration docs

- Stack management and cutover guidance: [docs/self-hosted-postgres-operations.md](/Users/cancelcloud/Developer/DevBrew/WebHealth/docs/self-hosted-postgres-operations.md)
- Neon migration and logical replication flow: [docs/self-hosted-postgres-migration.md](/Users/cancelcloud/Developer/DevBrew/WebHealth/docs/self-hosted-postgres-migration.md)
- Monitoring deployment: [infra/monitoring/README.md](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/monitoring/README.md)

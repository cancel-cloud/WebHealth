# Self-Hosted Postgres Stack

This stack runs WebHealth's PostgreSQL backend as a Coolify-friendly Docker Compose deployment on Hetzner while preserving the split DB contract:

- `DATABASE_URL`: pooled runtime endpoint through PgBouncer on port `6432`
- `DIRECT_DATABASE_URL`: private direct Postgres endpoint for Drizzle migrations, worker startup migrations, and `LISTEN/NOTIFY`

## Included services

- `postgres`: primary database with `pg_stat_statements`, logical replication, WAL archiving, and local PITR support
- `pgbouncer`: the only public DB endpoint for Vercel/app runtime traffic
- `pgbackrest`: headless backup loop for nightly full backups, 6-hour differential backups, and WAL archive management
- `postgres-exporter`, `node-exporter`: exporter endpoints for the separate monitoring stack
- `pgadmin`: browser-based admin UI for occasional inspection and debugging over an SSH tunnel

## Deploy in Coolify

1. Copy `.env.example` to `.env` and replace every placeholder with production secrets.
2. Generate a TLS certificate and key for Postgres/PgBouncer transport encryption:

```bash
openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
  -keyout db-tls.key -out db-tls.crt \
  -subj "/CN=db.webhealth.devbrew.dev" \
  -addext "subjectAltName=DNS:db.webhealth.devbrew.dev,IP:178.104.11.44"
```

3. In Coolify, add `DB_TLS_CERT_PEM` and `DB_TLS_KEY_PEM` as multiline runtime environment variables. The containers will write `server.crt` and `server.key` on startup.
4. In Coolify, create a Docker Compose resource that uses [`docker-compose.yml`](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/self-hosted-postgres/docker-compose.yml).
5. Publish only:
   - `pgbouncer` on `db.webhealth.devbrew.dev` and port `6432`
6. Keep `postgres`, `pgbackrest`, `pgadmin`, and the exporter services unexposed to the public internet. Postgres binds `5432` on the host for same-machine resources such as the worker, so your firewall must continue blocking external inbound access to `5432`. pgAdmin binds only to host loopback on `127.0.0.1:5050`.
7. Deploy the separate monitoring stack from [infra/monitoring](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/monitoring) for Prometheus and Grafana.

The default image pin is PostgreSQL `18.3` via `POSTGRES_BASE_IMAGE=postgres:18.3-bookworm`.

If the first initialization fails before the init script creates the `webhealth` database and roles, remove the self-hosted Postgres data volume and redeploy before launch data is written. The init scripts only run on a fresh cluster.

## Runtime env mapping

After the stack is live, the app-side envs should look like:

```bash
DATABASE_URL=postgresql://<runtime-user>:<pass>@db.webhealth.devbrew.dev:6432/webhealth?sslmode=require
DIRECT_DATABASE_URL=postgresql://<direct-user>:<pass>@178.104.11.44:5432/webhealth?sslmode=require
```

Use SSH tunneling or same-host private access for direct connections. Do not open `5432` in the external firewall.

For pgAdmin, tunnel to the DB host first:

```bash
ssh -L 5050:127.0.0.1:5050 root@178.104.11.44
```

Then open `http://127.0.0.1:5050` locally.

In Coolify, set `DB_TLS_CERT_PEM` and `DB_TLS_KEY_PEM` in Normal View with `Multiline` enabled. If your key contains `$`, also enable `Literal`.

The generated certificate above is self-signed. That is fine for encrypted transport with `sslmode=require`, but it does not provide CA-backed identity verification. If you later want `verify-full`, issue a certificate from a trusted internal or public CA instead.

## Day-2 operations

- Backup status: check the Grafana dashboard in the separate monitoring stack
- Manual backup:

```bash
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml exec pgbackrest pgbackrest --stanza=webhealth backup --type=full
```

- Backup inventory:

```bash
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml exec pgbackrest pgbackrest --stanza=webhealth info
```

- Restore rehearsal:

```bash
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml run --rm postgres bash -lc 'rm -rf "$PGDATA"/* && pgbackrest --stanza=webhealth --delta restore'
```

## Related docs

- Stack management: [docs/self-hosted-postgres-operations.md](/Users/cancelcloud/Developer/DevBrew/WebHealth/docs/self-hosted-postgres-operations.md)
- Monitoring deployment: [infra/monitoring/README.md](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/monitoring/README.md)

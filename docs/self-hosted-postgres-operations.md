# Self-Hosted Postgres Operations

This runbook covers day-to-day management of the database Compose stack in [`infra/self-hosted-postgres`](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/self-hosted-postgres).

## What the stack manages

- PostgreSQL primary with `pg_stat_statements`
- PgBouncer on the public pooled port `6432`
- pgBackRest with local PITR repository
- postgres_exporter and node_exporter for the separate monitoring stack
- pgAdmin on host loopback only for SSH-tunneled access

## Start or update the stack

From repo root:

```bash
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml pull
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml up -d --build
```

## Health checks

```bash
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml ps
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml logs postgres --tail=100
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml logs pgbackrest --tail=100
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml logs pgbouncer --tail=100
```

Key checks:

- PgBouncer accepts TLS connections on `6432`
- direct Postgres is reachable only on host loopback/private access paths
- pgAdmin listens only on `127.0.0.1:5050`
- the exporter endpoints are healthy so the monitoring stack can scrape them

## pgAdmin access

pgAdmin is intentionally not published to the public internet. Access it by tunneling to the DB host:

```bash
ssh -L 5050:127.0.0.1:5050 root@178.104.11.44
```

Then open `http://127.0.0.1:5050` locally.

## Backup management

Nightly full and 6-hour diff backups are driven by the `pgbackrest` service loop. WAL archiving is continuous via `archive_command`.

Manual commands:

```bash
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml exec pgbackrest pgbackrest --stanza=webhealth info
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml exec pgbackrest pgbackrest --stanza=webhealth check
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml exec pgbackrest pgbackrest --stanza=webhealth backup --type=full
docker compose --project-directory . -f infra/self-hosted-postgres/docker-compose.yml exec pgbackrest pgbackrest --stanza=webhealth backup --type=diff
```

## Restore rehearsal

Run restores on a scratch host or a disposable copy of the stack. Do not restore over the live primary.

Minimum rehearsal:

1. Stop app traffic.
2. Start a disposable Postgres container with the same image.
3. Mount the same backup repository read-only.
4. Run:

```bash
pgbackrest --stanza=webhealth --delta restore
```

5. Start Postgres and validate row counts, auth, queue tables, and report reads.

## Routine SQL checks

Database size:

```sql
select pg_size_pretty(pg_database_size(current_database()));
```

Largest tables:

```sql
select schemaname, relname, pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_catalog.pg_statio_user_tables
order by pg_total_relation_size(relid) desc
limit 20;
```

## Accepted risk

This v1 stack keeps PITR backups on the same Hetzner host as the primary. That protects against operator mistakes and bad deploys, but it does not protect against host loss.

If the worker stays in a separate Coolify resource, use Coolify's predefined network and the generated Postgres service name for `DIRECT_DATABASE_URL`. Host loopback `127.0.0.1:5432` is only for admin access on the DB host or SSH tunneling.

Grafana and Prometheus now live in the separate monitoring stack under [infra/monitoring](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/monitoring).

TLS materials are injected through Coolify runtime environment variables:

- `DB_TLS_CERT_PEM`
- `DB_TLS_KEY_PEM`

Set them in Coolify Normal View with `Multiline` enabled. If the private key contains `$`, also enable `Literal`.

# Monitoring Stack

This stack runs the shared monitoring UI and time-series store for WebHealth:

- `prometheus`: scrapes exporter endpoints from the database stack
- `grafana`: dashboards and alerting UI on `grafana.devbrew.dev`

Exporter services stay in the database stack so backup metrics and host metrics remain attached to the systems they observe.

## Deploy in Coolify

1. Copy `.env.example` to `.env` and replace placeholders with production values.
2. Create a separate Docker Compose resource in Coolify that uses [`docker-compose.yml`](/Users/cancelcloud/Developer/DevBrew/WebHealth/infra/monitoring/docker-compose.yml).
3. Put the monitoring stack on the same Coolify predefined network as the database stack, or use private hostnames/IPs for the scrape targets.
4. Publish only `grafana` on `grafana.devbrew.dev`.
5. Keep `prometheus` private.
6. Set the scrape targets to the database stack exporter service names on Coolify's predefined network:
   - `PROMETHEUS_POSTGRES_EXPORTER_TARGET`
   - `PROMETHEUS_NODE_EXPORTER_TARGET`

## Runtime expectations

- `PROMETHEUS_POSTGRES_EXPORTER_TARGET` should point at the Postgres exporter in the DB stack, for example `postgres-exporter-<coolify-id>:9187`
- `PROMETHEUS_NODE_EXPORTER_TARGET` should point at the node exporter in the DB stack, for example `node-exporter-<coolify-id>:9100`

Both targets can also be private hostnames or IPs if you do not use the predefined network.

## Dashboard coverage

The bundled Grafana dashboard covers:

- database size
- largest tables
- cache hit ratio
- dead tuples
- active sessions
- backup age
- archive freshness
- host disk, memory, and CPU metrics

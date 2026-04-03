#!/bin/sh
set -eu

cat > /etc/prometheus/prometheus.yml <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: postgres
    static_configs:
      - targets: ["${PROMETHEUS_POSTGRES_EXPORTER_TARGET}"]

  - job_name: node
    static_configs:
      - targets: ["${PROMETHEUS_NODE_EXPORTER_TARGET}"]
EOF

exec /bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/prometheus \
  --storage.tsdb.retention.time="${PROMETHEUS_RETENTION_TIME}"

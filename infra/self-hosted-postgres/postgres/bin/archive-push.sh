#!/usr/bin/env bash
set -euo pipefail

wal_path="${1:?wal path is required}"
stanza="${WEBHEALTH_PGBACKREST_STANZA:-webhealth}"
metrics_dir="/var/lib/node_exporter/textfile_collector"
metrics_file="${metrics_dir}/pgbackrest-archive.prom"

pgbackrest \
  --stanza="${stanza}" \
  --repo1-path=/var/lib/pgbackrest \
  archive-push "${wal_path}"

mkdir -p "${metrics_dir}"
cat > "${metrics_file}" <<EOF
pgbackrest_archive_last_success_timestamp_seconds $(date +%s)
EOF

#!/usr/bin/env bash
set -euo pipefail

config_dir="/etc/pgbouncer"
mkdir -p "${config_dir}"

if [[ -n "${DB_TLS_CERT_PEM:-}" ]]; then
  mkdir -p "$(dirname "${PGBOUNCER_TLS_CERT_FILE}")"
  printf '%s\n' "${DB_TLS_CERT_PEM}" > "${PGBOUNCER_TLS_CERT_FILE}"
  chmod 0644 "${PGBOUNCER_TLS_CERT_FILE}"
fi

if [[ -n "${DB_TLS_KEY_PEM:-}" ]]; then
  mkdir -p "$(dirname "${PGBOUNCER_TLS_KEY_FILE}")"
  printf '%s\n' "${DB_TLS_KEY_PEM}" > "${PGBOUNCER_TLS_KEY_FILE}"
  chmod 0600 "${PGBOUNCER_TLS_KEY_FILE}"
fi

cat > "${config_dir}/userlist.txt" <<EOF
"${POSTGRES_SUPERUSER}" "${POSTGRES_SUPERUSER_PASSWORD}"
"${POSTGRES_RUNTIME_USER}" "${POSTGRES_RUNTIME_PASSWORD}"
"${POSTGRES_DIRECT_USER}" "${POSTGRES_DIRECT_PASSWORD}"
"${POSTGRES_MONITORING_USER}" "${POSTGRES_MONITORING_PASSWORD}"
EOF

cat > "${config_dir}/pgbouncer.ini" <<EOF
[databases]
${POSTGRES_DB} = host=${POSTGRES_HOST:-postgres} port=${POSTGRES_PORT:-5432} dbname=${POSTGRES_DB}

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = ${PGBOUNCER_LISTEN_PORT:-6432}
auth_type = plain
auth_file = ${config_dir}/userlist.txt
pool_mode = ${PGBOUNCER_POOL_MODE:-transaction}
max_client_conn = ${PGBOUNCER_MAX_CLIENT_CONN:-500}
default_pool_size = ${PGBOUNCER_DEFAULT_POOL_SIZE:-20}
reserve_pool_size = ${PGBOUNCER_RESERVE_POOL_SIZE:-10}
server_idle_timeout = ${PGBOUNCER_SERVER_IDLE_TIMEOUT:-60}
admin_users = ${PGBOUNCER_ADMIN_USERS:-}
stats_users = ${PGBOUNCER_STATS_USERS:-}
ignore_startup_parameters = extra_float_digits,options
server_reset_query = DISCARD ALL
server_tls_sslmode = disable
client_tls_sslmode = require
client_tls_cert_file = ${PGBOUNCER_TLS_CERT_FILE}
client_tls_key_file = ${PGBOUNCER_TLS_KEY_FILE}
EOF

exec pgbouncer "${config_dir}/pgbouncer.ini"

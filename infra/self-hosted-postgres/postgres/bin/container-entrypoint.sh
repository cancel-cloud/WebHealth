#!/usr/bin/env bash
set -euo pipefail

cert_dir="/etc/postgres/certs"
cert_file="${cert_dir}/server.crt"
key_file="${cert_dir}/server.key"

mkdir -p "${cert_dir}"

if [[ -n "${DB_TLS_CERT_PEM:-}" ]]; then
  printf '%s\n' "${DB_TLS_CERT_PEM}" > "${cert_file}"
  chmod 0644 "${cert_file}"
fi

if [[ -n "${DB_TLS_KEY_PEM:-}" ]]; then
  printf '%s\n' "${DB_TLS_KEY_PEM}" > "${key_file}"
  chmod 0600 "${key_file}"
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"

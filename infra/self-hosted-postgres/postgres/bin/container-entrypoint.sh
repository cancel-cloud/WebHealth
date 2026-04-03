#!/usr/bin/env bash
set -euo pipefail

cert_dir="/etc/postgres/certs"
cert_file="${cert_dir}/server.crt"
key_file="${cert_dir}/server.key"

write_pem_file() {
  local value="$1"
  local target="$2"
  local mode="$3"

  value="${value//$'\r'/}"
  printf '%b\n' "${value}" > "${target}"
  chmod "${mode}" "${target}"
}

mkdir -p "${cert_dir}"

if [[ -n "${DB_TLS_CERT_PEM:-}" ]]; then
  write_pem_file "${DB_TLS_CERT_PEM}" "${cert_file}" 0644
fi

if [[ -n "${DB_TLS_KEY_PEM:-}" ]]; then
  write_pem_file "${DB_TLS_KEY_PEM}" "${key_file}" 0600
fi

exec /usr/local/bin/docker-entrypoint.sh "$@"

#!/usr/bin/env bash
set -euo pipefail

stanza="${PGBACKREST_STANZA:-webhealth}"
repo_dir="/var/lib/pgbackrest"
metrics_dir="/var/lib/node_exporter/textfile_collector"
state_dir="${repo_dir}/schedule-state"
full_interval="${PGBACKREST_FULL_INTERVAL_SECONDS:-86400}"
diff_interval="${PGBACKREST_DIFF_INTERVAL_SECONDS:-21600}"
sleep_interval="${PGBACKREST_LOOP_SLEEP_SECONDS:-300}"
full_stamp="${state_dir}/last-full"
diff_stamp="${state_dir}/last-diff"
failure_stamp="${state_dir}/last-failure"

mkdir -p "${state_dir}" "${metrics_dir}"

function write_metrics() {
  local full_value="0"
  local diff_value="0"
  local failure_value="0"

  [[ -f "${full_stamp}" ]] && full_value="$(cat "${full_stamp}")"
  [[ -f "${diff_stamp}" ]] && diff_value="$(cat "${diff_stamp}")"
  [[ -f "${failure_stamp}" ]] && failure_value="$(cat "${failure_stamp}")"

  cat > "${metrics_dir}/pgbackrest-backups.prom" <<EOF
pgbackrest_backup_last_success_timestamp_seconds{type="full"} ${full_value}
pgbackrest_backup_last_success_timestamp_seconds{type="diff"} ${diff_value}
pgbackrest_backup_last_failure_timestamp_seconds ${failure_value}
EOF
}

function wait_for_postgres() {
  until pg_isready -h /var/run/postgresql -U "${POSTGRES_DIRECT_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; do
    sleep 2
  done
}

function run_backup() {
  local backup_type="${1:?backup type is required}"
  local stamp_file="${2:?stamp file is required}"

  if pgbackrest \
    --stanza="${stanza}" \
    --repo1-path=/var/lib/pgbackrest \
    --repo1-retention-full="${PGBACKREST_REPO_RETENTION_FULL:-7}" \
    --repo1-retention-diff="${PGBACKREST_REPO_RETENTION_DIFF:-28}" \
    --pg1-path=/var/lib/postgresql/data \
    --pg1-socket-path=/var/run/postgresql \
    --pg1-user="${POSTGRES_DIRECT_USER}" \
    backup --type="${backup_type}"; then
    date +%s > "${stamp_file}"
    write_metrics
    return 0
  fi

  date +%s > "${failure_stamp}"
  write_metrics
  return 1
}

wait_for_postgres
pgbackrest \
  --stanza="${stanza}" \
  --repo1-path=/var/lib/pgbackrest \
  --pg1-path=/var/lib/postgresql/data \
  --pg1-socket-path=/var/run/postgresql \
  --pg1-user="${POSTGRES_DIRECT_USER}" \
  stanza-create || true
pgbackrest \
  --stanza="${stanza}" \
  --repo1-path=/var/lib/pgbackrest \
  --pg1-path=/var/lib/postgresql/data \
  --pg1-socket-path=/var/run/postgresql \
  --pg1-user="${POSTGRES_DIRECT_USER}" \
  check

while true; do
  now="$(date +%s)"

  if [[ ! -f "${full_stamp}" ]] || (( now - $(cat "${full_stamp}") >= full_interval )); then
    run_backup full "${full_stamp}" || true
    date +%s > "${diff_stamp}"
    write_metrics
  elif [[ ! -f "${diff_stamp}" ]] || (( now - $(cat "${diff_stamp}") >= diff_interval )); then
    run_backup diff "${diff_stamp}" || true
  fi

  write_metrics
  sleep "${sleep_interval}"
done

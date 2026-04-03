ARG PGBOUNCER_BASE_IMAGE=debian:bookworm-slim
FROM ${PGBOUNCER_BASE_IMAGE}

RUN apt-get update \
  && apt-get install -y --no-install-recommends pgbouncer ca-certificates \
  && groupadd --system pgbouncer \
  && useradd --system --gid pgbouncer --home-dir /var/lib/pgbouncer --create-home --shell /usr/sbin/nologin pgbouncer \
  && rm -rf /var/lib/apt/lists/*

COPY bin/entrypoint.sh /opt/webhealth/bin/entrypoint.sh
RUN chmod +x /opt/webhealth/bin/entrypoint.sh

ENTRYPOINT ["/opt/webhealth/bin/entrypoint.sh"]

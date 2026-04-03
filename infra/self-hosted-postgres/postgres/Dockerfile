ARG POSTGRES_BASE_IMAGE=postgres:18.3-bookworm
FROM ${POSTGRES_BASE_IMAGE}

RUN apt-get update \
  && apt-get install -y --no-install-recommends pgbackrest ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY conf/postgresql.conf /opt/webhealth/postgresql.conf
COPY conf/pg_hba.conf /opt/webhealth/pg_hba.conf
COPY init/01-init-cluster.sh /docker-entrypoint-initdb.d/01-init-cluster.sh
COPY bin/archive-push.sh /opt/webhealth/bin/archive-push.sh
COPY bin/backup-loop.sh /opt/webhealth/bin/backup-loop.sh
COPY bin/container-entrypoint.sh /opt/webhealth/bin/container-entrypoint.sh

RUN chmod +x \
  /docker-entrypoint-initdb.d/01-init-cluster.sh \
  /opt/webhealth/bin/archive-push.sh \
  /opt/webhealth/bin/backup-loop.sh \
  /opt/webhealth/bin/container-entrypoint.sh

ENTRYPOINT ["/opt/webhealth/bin/container-entrypoint.sh"]

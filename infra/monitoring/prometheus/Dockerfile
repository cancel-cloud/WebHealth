ARG PROMETHEUS_BASE_IMAGE=prom/prometheus:latest
FROM ${PROMETHEUS_BASE_IMAGE}

COPY bin/entrypoint.sh /opt/webhealth/bin/entrypoint.sh

ENTRYPOINT ["/bin/sh", "/opt/webhealth/bin/entrypoint.sh"]

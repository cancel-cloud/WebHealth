import test from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCT_EVENT_NAMES,
  buildPosthogErrorEventProperties,
  buildPosthogCaptureEndpoint,
  buildPosthogCapturePayload,
  buildProductEventPayload,
  getPosthogDistinctId,
  resolvePosthogProjectToken,
  isProductEventName,
} from "./product-events";

test("isProductEventName only accepts the approved authenticated product events", () => {
  assert.equal(isProductEventName("property_activated"), true);
  assert.equal(isProductEventName("snapshot_captured"), true);
  assert.equal(isProductEventName("manual_report_created"), false);
  assert.equal(isProductEventName("signup_clicked"), false);
});

test("approved product event names remain stable for analytics dashboards", () => {
  assert.deepEqual(PRODUCT_EVENT_NAMES, [
    "dashboard_opened",
    "property_activated",
    "property_deactivated",
    "refresh_started",
    "refresh_completed",
    "refresh_failed",
    "ai_run_queued",
    "ai_run_started",
    "ai_run_completed",
    "ai_run_failed",
    "action_state_changed",
    "snapshot_captured",
    "snapshot_copied",
    "snapshot_opened",
    "snapshot_share_created",
    "billing_cta_clicked",
    "google_reconnect_started",
    "posthog_install_check_ran",
    "app_error_reported",
    "worker_error_reported",
    "weekly_watch_enabled",
    "weekly_auto_report_enqueued",
    "weekly_auto_report_completed",
    "weekly_report_opened",
    "weekly_dashboard_card_viewed",
  ]);
});

test("buildProductEventPayload drops raw PII from event properties", () => {
  const payload = buildProductEventPayload({
    teamId: "team_1",
    userId: "user_1",
    name: "snapshot_captured",
    source: "properties",
    properties: {
      email: "person@example.com",
      userName: "Person",
      propertyId: "gsc_sc-domain:example.com",
    },
  });

  assert.equal(payload.properties.email, undefined);
  assert.equal(payload.properties.userName, undefined);
  assert.equal(payload.properties.propertyId, "gsc_sc-domain:example.com");
});

test("PostHog capture payload no-ops when env configuration is absent", () => {
  const payload = buildProductEventPayload({
    teamId: "team_1",
    userId: "user_1",
    name: "snapshot_captured",
    source: "api",
  });

  assert.equal(buildPosthogCapturePayload({}, payload), null);
});

test("PostHog capture payload uses stable labels without raw PII", () => {
  const payload = buildProductEventPayload({
    teamId: "team_1",
    userId: "user_1",
    name: "snapshot_captured",
    source: "snapshot",
    entityType: "snapshot",
    entityId: "snap_1",
    properties: {
      email: "person@example.com",
      propertyId: "gsc_sc-domain:example.com",
    },
  });

  const capture = buildPosthogCapturePayload({ projectToken: "ph_test" }, payload);
  const captureProperties = capture?.properties as Record<string, unknown> | undefined;

  assert.equal(capture?.event, "snapshot_captured");
  assert.equal(capture?.distinct_id, "user_1");
  assert.equal(captureProperties?.email, undefined);
  assert.equal(captureProperties?.propertyId, "gsc_sc-domain:example.com");
});

test("PostHog capture payload uses user id as distinct id and falls back to team id", () => {
  const userPayload = buildProductEventPayload({
    teamId: "team_1",
    userId: "user_pg_123",
    name: "dashboard_opened",
    source: "dashboard",
  });
  const teamPayload = buildProductEventPayload({
    teamId: "team_1",
    name: "weekly_auto_report_completed",
    source: "worker",
  });

  assert.equal(getPosthogDistinctId(userPayload), "user_pg_123");
  assert.equal(getPosthogDistinctId(teamPayload), "team_1");
  assert.equal(
    buildPosthogCapturePayload({ projectToken: "phc_test" }, userPayload)?.distinct_id,
    "user_pg_123",
  );
  assert.equal(
    buildPosthogCapturePayload({ projectToken: "phc_test" }, teamPayload)?.distinct_id,
    "team_1",
  );
});

test("PostHog project token prefers renamed env with legacy fallback", () => {
  assert.equal(
    resolvePosthogProjectToken({
      POSTHOG_PROJECT_TOKEN: "phc_server",
      POSTHOG_API_KEY: "phc_legacy",
      NEXT_PUBLIC_POSTHOG_KEY: "phc_public",
    }),
    "phc_server",
  );
  assert.equal(
    resolvePosthogProjectToken({
      POSTHOG_API_KEY: "phc_legacy",
      NEXT_PUBLIC_POSTHOG_KEY: "phc_public",
    }),
    "phc_legacy",
  );
  assert.equal(
    resolvePosthogProjectToken({
      NEXT_PUBLIC_POSTHOG_KEY: "phc_public",
    }),
    "phc_public",
  );
});

test("PostHog error event properties are sanitized for analytics", () => {
  const properties = buildPosthogErrorEventProperties({
    surface: "route-handler",
    code: "PROPERTY_REFRESH_WORKER_UNREACHABLE",
    status: 502,
    message: "Database password=s3cret stack at /Users/person/app.ts",
    context: {
      route: "/api/properties/prop_1/refresh-data",
      jobId: "job_123",
      stack: "raw stack",
      token: "secret",
      email: "person@example.com",
    },
  });

  assert.deepEqual(properties, {
    errorSurface: "route-handler",
    errorCode: "PROPERTY_REFRESH_WORKER_UNREACHABLE",
    status: 502,
    message: "Database password=[REDACTED] stack at [REDACTED_PATH]",
    route: "/api/properties/prop_1/refresh-data",
    jobId: "job_123",
  });
});

test("PostHog capture endpoint uses the managed proxy event endpoint", () => {
  assert.equal(
    buildPosthogCaptureEndpoint({ host: "https://d.devbrew.dev/" }),
    "https://d.devbrew.dev/i/v0/e/",
  );
});

test("PostHog capture endpoint falls back to the managed proxy", () => {
  assert.equal(
    buildPosthogCaptureEndpoint({}),
    "https://d.devbrew.dev/i/v0/e/",
  );
});

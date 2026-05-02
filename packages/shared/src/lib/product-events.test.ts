import test from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCT_EVENT_NAMES,
  buildPosthogCapturePayload,
  buildProductEventPayload,
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

  const capture = buildPosthogCapturePayload({ apiKey: "ph_test" }, payload);
  const captureProperties = capture?.properties as Record<string, unknown> | undefined;

  assert.equal(capture?.event, "snapshot_captured");
  assert.equal(capture?.distinct_id, "user_1");
  assert.equal(captureProperties?.email, undefined);
  assert.equal(captureProperties?.propertyId, "gsc_sc-domain:example.com");
});

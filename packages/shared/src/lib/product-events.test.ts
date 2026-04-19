import test from "node:test";
import assert from "node:assert/strict";
import {
  PRODUCT_EVENT_NAMES,
  buildPosthogCapturePayload,
  buildProductEventPayload,
  isProductEventName,
} from "./product-events";

test("isProductEventName only accepts the approved authenticated product events", () => {
  assert.equal(isProductEventName("weekly_watch_enabled"), true);
  assert.equal(isProductEventName("manual_report_created"), true);
  assert.equal(isProductEventName("signup_clicked"), false);
});

test("approved product event names remain stable for analytics dashboards", () => {
  assert.deepEqual(PRODUCT_EVENT_NAMES, [
    "weekly_watch_enabled",
    "weekly_watch_disabled",
    "weekly_auto_report_enqueued",
    "weekly_auto_report_completed",
    "weekly_auto_report_skipped_quota",
    "weekly_dashboard_card_viewed",
    "weekly_report_opened",
    "manual_report_created",
    "manual_report_opened",
    "report_detail_requested",
  ]);
});

test("buildProductEventPayload drops raw PII from event properties", () => {
  const payload = buildProductEventPayload({
    teamId: "team_1",
    userId: "user_1",
    name: "weekly_watch_enabled",
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
    name: "manual_report_created",
    source: "api",
  });

  assert.equal(buildPosthogCapturePayload({}, payload), null);
});

test("PostHog capture payload uses stable labels without raw PII", () => {
  const payload = buildProductEventPayload({
    teamId: "team_1",
    userId: "user_1",
    name: "weekly_report_opened",
    source: "report_detail",
    entityType: "report",
    entityId: "report_1",
    properties: {
      email: "person@example.com",
      reportSource: "auto_weekly",
    },
  });

  const capture = buildPosthogCapturePayload({ apiKey: "ph_test" }, payload);
  const captureProperties = capture?.properties as Record<string, unknown> | undefined;

  assert.equal(capture?.event, "weekly_report_opened");
  assert.equal(capture?.distinct_id, "user_1");
  assert.equal(captureProperties?.email, undefined);
  assert.equal(captureProperties?.reportSource, "auto_weekly");
});

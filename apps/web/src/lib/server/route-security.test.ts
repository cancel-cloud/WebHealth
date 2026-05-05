import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, { mock } from "node:test";

import { reportHandledRouteFailure } from "./route-security";

const require = createRequire(import.meta.url);
const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");

test("reportHandledRouteFailure skips handled 404 responses", () => {
  const withScope = mock.method(Sentry, "withScope", () => undefined);
  const captureMessage = mock.method(Sentry, "captureMessage", () => "ignored");

  reportHandledRouteFailure({
    label: "Error handling property refresh",
    status: 404,
    code: "PROPERTY_REFRESH_NOT_FOUND",
    message: "Property refresh not found",
  });

  assert.equal(withScope.mock.calls.length, 0);
  assert.equal(captureMessage.mock.calls.length, 0);

  withScope.mock.restore();
  captureMessage.mock.restore();
});

test("reportHandledRouteFailure reports handled 5xx responses with route context", () => {
  const tags = new Map<string, string>();
  const contexts = new Map<string, unknown>();
  let level = "";

  const withScope = mock.method(Sentry, "withScope", (callback: (scope: {
    setTag: (key: string, value: string) => void;
    setLevel: (value: string) => void;
    setContext: (name: string, value: unknown) => void;
  }) => void) => {
    callback({
      setTag: (key, value) => {
        tags.set(key, value);
      },
      setLevel: (value) => {
        level = value;
      },
      setContext: (name, value) => {
        contexts.set(name, value);
      },
    });
  });
  const captureMessage = mock.method(Sentry, "captureMessage", (message: string) => message);

  reportHandledRouteFailure({
    label: "Error handling property refresh",
    status: 502,
    code: "PROPERTY_REFRESH_WORKER_UNREACHABLE",
    message: "Property refresh failed: PROPERTY_REFRESH_WORKER_UNREACHABLE",
    context: {
      propertyId: "prop_123",
      workerConfigured: true,
    },
  });

  assert.equal(withScope.mock.calls.length, 1);
  assert.equal(captureMessage.mock.calls.length, 1);
  assert.deepEqual(captureMessage.mock.calls[0]?.arguments, [
    "Property refresh failed: PROPERTY_REFRESH_WORKER_UNREACHABLE",
  ]);
  assert.equal(tags.get("error_surface"), "route-handler");
  assert.equal(tags.get("route_error_label"), "Error handling property refresh");
  assert.equal(tags.get("handled_route_failure_code"), "PROPERTY_REFRESH_WORKER_UNREACHABLE");
  assert.equal(level, "error");
  assert.deepEqual(contexts.get("handled_route_failure"), {
    status: 502,
    code: "PROPERTY_REFRESH_WORKER_UNREACHABLE",
    propertyId: "prop_123",
    workerConfigured: true,
  });

  withScope.mock.restore();
  captureMessage.mock.restore();
});

test("reportHandledRouteFailure emits a sanitized PostHog error event for handled 5xx responses", () => {
  const events: unknown[] = [];
  const withScope = mock.method(Sentry, "withScope", () => undefined);
  const captureMessage = mock.method(Sentry, "captureMessage", (message: string) => message);

  reportHandledRouteFailure({
    label: "Error handling property refresh",
    status: 502,
    code: "PROPERTY_REFRESH_WORKER_UNREACHABLE",
    message: "Property refresh password=s3cret failed at /Users/person/app.ts",
    context: {
      teamId: "team_1",
      userId: "user_pg_123",
      route: "/api/properties/prop_123/refresh-data",
      stack: "raw stack",
      token: "secret",
    },
    productEventRecorder: (event) => {
      events.push(event);
    },
  });

  assert.deepEqual(events, [
    {
      teamId: "team_1",
      userId: "user_pg_123",
      name: "app_error_reported",
      source: "api",
      entityType: "route",
      entityId: "Error handling property refresh",
      properties: {
        errorSurface: "route-handler",
        errorCode: "PROPERTY_REFRESH_WORKER_UNREACHABLE",
        status: 502,
        message: "Property refresh password=[REDACTED] failed at [REDACTED_PATH]",
        route: "/api/properties/prop_123/refresh-data",
      },
    },
  ]);

  withScope.mock.restore();
  captureMessage.mock.restore();
});

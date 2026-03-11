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
    label: "Error downloading report artifact",
    status: 404,
    code: "ARTIFACT_NOT_FOUND",
    message: "Artifact not found",
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
    label: "Error downloading report artifact",
    status: 502,
    code: "ARTIFACT_WORKER_UNREACHABLE",
    message: "Artifact download failed: ARTIFACT_WORKER_UNREACHABLE",
    context: {
      reportId: "rep_123",
      workerConfigured: true,
    },
  });

  assert.equal(withScope.mock.calls.length, 1);
  assert.equal(captureMessage.mock.calls.length, 1);
  assert.deepEqual(captureMessage.mock.calls[0]?.arguments, [
    "Artifact download failed: ARTIFACT_WORKER_UNREACHABLE",
  ]);
  assert.equal(tags.get("error_surface"), "route-handler");
  assert.equal(tags.get("route_error_label"), "Error downloading report artifact");
  assert.equal(tags.get("handled_route_failure_code"), "ARTIFACT_WORKER_UNREACHABLE");
  assert.equal(level, "error");
  assert.deepEqual(contexts.get("handled_route_failure"), {
    status: 502,
    code: "ARTIFACT_WORKER_UNREACHABLE",
    reportId: "rep_123",
    workerConfigured: true,
  });

  withScope.mock.restore();
  captureMessage.mock.restore();
});

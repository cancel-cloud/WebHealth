import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, { mock } from "node:test";

import { AppError } from "./app-error";
import { reportClientError } from "./report-error";

const require = createRequire(import.meta.url);
const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");
const posthog = require("posthog-js").default as typeof import("posthog-js").default;

test("reportClientError skips handled app errors", () => {
  const captureException = mock.method(Sentry, "captureException", () => "ignored");

  reportClientError(
    new AppError("Invalid input", {
      code: "INVALID_INPUT",
      status: 400,
      handled: true,
    }),
  );

  assert.equal(captureException.mock.calls.length, 0);
  captureException.mock.restore();
});

test("reportClientError forwards unexpected errors to Sentry", () => {
  const reported: unknown[] = [];
  const captureException = mock.method(Sentry, "captureException", (error: unknown) => {
    reported.push(error);
    return "reported";
  });

  const error = new AppError("Network failed", {
    code: "NETWORK_ERROR",
    handled: false,
  });

  reportClientError(error);

  assert.deepEqual(reported, [error]);
  assert.equal(captureException.mock.calls.length, 1);
  captureException.mock.restore();
});

test("shouldReportClientError skips abort-like errors", () => {
  const captureException = mock.method(Sentry, "captureException", () => "ignored");

  reportClientError({ name: "AbortError" });

  assert.equal(captureException.mock.calls.length, 0);
  captureException.mock.restore();
});

test("reportClientError emits a sanitized PostHog app error event", () => {
  const captureException = mock.method(Sentry, "captureException", () => "reported");
  const capture = mock.method(posthog, "capture", (eventName: string, properties?: Record<string, unknown>) => ({
    eventName,
    properties,
  }));

  reportClientError(new Error("Request password=s3cret failed at /Users/person/app.ts"), {
    route: "/dashboard",
    stack: "raw stack",
    token: "secret",
  });

  assert.equal(capture.mock.calls.length, 1);
  assert.deepEqual(capture.mock.calls[0]?.arguments, [
    "app_error_reported",
    {
      errorSurface: "client-request",
      message: "Request password=[REDACTED] failed at [REDACTED_PATH]",
      route: "/dashboard",
    },
  ]);

  captureException.mock.restore();
  capture.mock.restore();
});

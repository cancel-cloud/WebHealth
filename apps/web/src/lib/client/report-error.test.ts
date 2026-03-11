import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, { mock } from "node:test";

import { AppError } from "./app-error";
import { reportClientError } from "./report-error";

const require = createRequire(import.meta.url);
const Sentry = require("@sentry/nextjs") as typeof import("@sentry/nextjs");

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

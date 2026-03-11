import assert from "node:assert/strict";
import test from "node:test";

import { AppError, getAppErrorMessage, isAppError } from "./app-error";

test("AppError stores normalized metadata", () => {
  const cause = new Error("root cause");
  const error = new AppError("Upgrade to create more reports.", {
    code: "PLAN_LIMIT_EXCEEDED",
    status: 402,
    handled: true,
    cause,
  });

  assert.equal(error.name, "AppError");
  assert.equal(error.message, "Upgrade to create more reports.");
  assert.equal(error.code, "PLAN_LIMIT_EXCEEDED");
  assert.equal(error.status, 402);
  assert.equal(error.handled, true);
  assert.equal(error.cause, cause);
});

test("isAppError narrows AppError instances", () => {
  assert.equal(isAppError(new AppError("Invalid input")), true);
  assert.equal(isAppError(new Error("boom")), false);
  assert.equal(isAppError("boom"), false);
});

test("getAppErrorMessage prefers AppError messages and falls back safely", () => {
  assert.equal(
    getAppErrorMessage(new AppError("Monthly AI detail limit reached.")),
    "Monthly AI detail limit reached."
  );
  assert.equal(
    getAppErrorMessage(new Error("Request failed")),
    "Request failed"
  );
  assert.equal(
    getAppErrorMessage("boom", "Something went wrong"),
    "Something went wrong"
  );
});

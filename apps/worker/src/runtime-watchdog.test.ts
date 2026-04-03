import assert from "node:assert/strict";
import test from "node:test";

import { shouldForceExitForStuckJob } from "./runtime-watchdog";

test("shouldForceExitForStuckJob returns false when there is no active job", () => {
  assert.equal(
    shouldForceExitForStuckJob({
      currentJobStartedAtMs: null,
      nowMs: 1_000,
      maxJobRuntimeMs: 30_000,
    }),
    false,
  );
});

test("shouldForceExitForStuckJob returns true when an active job exceeds the runtime budget", () => {
  assert.equal(
    shouldForceExitForStuckJob({
      currentJobStartedAtMs: 1_000,
      nowMs: 40_500,
      maxJobRuntimeMs: 30_000,
    }),
    true,
  );
});

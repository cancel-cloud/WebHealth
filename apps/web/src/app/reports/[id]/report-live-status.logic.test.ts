import assert from "node:assert/strict";
import test from "node:test";

import {
  shouldIgnoreTerminalPollResult,
  shouldPollReportLiveStatus,
} from "./report-live-status.logic";

test("polls while report is queued or processing", () => {
  assert.equal(shouldPollReportLiveStatus("queued", "ready"), true);
  assert.equal(shouldPollReportLiveStatus("processing", "ready"), true);
});

test("polls while xlsx render is pending or generating even when report is complete", () => {
  assert.equal(shouldPollReportLiveStatus("complete", "pending"), true);
  assert.equal(shouldPollReportLiveStatus("complete", "generating"), true);
});

test("does not poll when report is scheduled even if xlsx looks active", () => {
  assert.equal(shouldPollReportLiveStatus("scheduled", "pending"), false);
  assert.equal(shouldPollReportLiveStatus("scheduled", "generating"), false);
});

test("does not poll when both report and xlsx are in terminal states", () => {
  assert.equal(shouldPollReportLiveStatus("complete", "ready"), false);
  assert.equal(shouldPollReportLiveStatus("complete", "failed"), false);
  assert.equal(shouldPollReportLiveStatus("failed", "ready"), false);
});

test("ignores a stale complete result right after an optimistic retry until the server confirms active work", () => {
  assert.equal(
    shouldIgnoreTerminalPollResult({
      currentStatus: "queued",
      currentXlsxStatus: "pending",
      nextStatus: "complete",
      nextXlsxStatus: "ready",
      hasConfirmedActiveServerState: false,
    }),
    true
  );
});

test("accepts terminal poll results once the server has confirmed the active run", () => {
  assert.equal(
    shouldIgnoreTerminalPollResult({
      currentStatus: "processing",
      currentXlsxStatus: "pending",
      nextStatus: "complete",
      nextXlsxStatus: "ready",
      hasConfirmedActiveServerState: true,
    }),
    false
  );
});

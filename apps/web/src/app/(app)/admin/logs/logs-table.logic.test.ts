import assert from "node:assert/strict";
import test from "node:test";
import { ACTION_OPTIONS, getActionLabel, getStatusLabel } from "./logs-table.logic";

test("log action filter removes deleted report actions", () => {
  const values = ACTION_OPTIONS.map((option) => option.value);

  assert.equal(values.includes("report_create"), false);
  assert.equal(values.includes("report_process"), false);
});

test("log action filter includes background AI and snapshot activity", () => {
  const values = ACTION_OPTIONS.map((option) => option.value);

  assert.equal(values.includes("ai_run_queued"), true);
  assert.equal(values.includes("ai_run_completed"), true);
  assert.equal(values.includes("refresh_started"), true);
  assert.equal(values.includes("snapshot_captured"), true);
  assert.equal(values.includes("snapshot_share_created"), true);
});

test("log labels present human-readable activity copy", () => {
  assert.equal(getActionLabel("ai_run_completed"), "AI insights completed");
  assert.equal(getActionLabel("snapshot_captured"), "Snapshot captured");
  assert.equal(getActionLabel("unknown_action"), "unknown_action");
  assert.equal(getStatusLabel("queued"), "Queued");
});


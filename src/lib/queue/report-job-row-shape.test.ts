import assert from "node:assert/strict";
import test from "node:test";

import { normalizeClaimedReportJobRow } from "./report-job-row-shape";

test("normalizes snake_case raw SQL claim rows to camelCase fields used by worker code", () => {
  const rawRow = {
    id: "rj_123",
    report_id: "rep_123",
    team_id: "team_123",
    claimed_by: "worker_abc",
    claim_expires_at: new Date("2026-02-26T22:30:00.000Z"),
    max_attempts: 3,
    kind: "generate_report",
    phase: "queued",
    status: "processing",
  };

  const normalized = normalizeClaimedReportJobRow(rawRow);

  assert.equal(normalized.reportId, "rep_123");
  assert.equal(normalized.teamId, "team_123");
  assert.equal(normalized.claimedBy, "worker_abc");
  assert.equal(normalized.claimExpiresAt, rawRow.claim_expires_at);
  assert.equal(normalized.maxAttempts, 3);
  assert.equal(normalized.kind, "generate_report");
  assert.equal(normalized.phase, "queued");
});

test("leaves camelCase rows intact", () => {
  const row = {
    id: "rj_456",
    reportId: "rep_456",
    teamId: "team_456",
    claimedBy: "worker_xyz",
    maxAttempts: 5,
  };

  const normalized = normalizeClaimedReportJobRow(row);

  assert.equal(normalized.reportId, "rep_456");
  assert.equal(normalized.teamId, "team_456");
  assert.equal(normalized.claimedBy, "worker_xyz");
  assert.equal(normalized.maxAttempts, 5);
});

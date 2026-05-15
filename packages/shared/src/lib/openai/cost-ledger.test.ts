import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOpenAICostLedgerInsert,
  summarizeOpenAICostLedgerRows,
} from "./cost-ledger";

const usage = {
  inputTokens: 10_000,
  outputTokens: 2_000,
  totalTokens: 12_000,
  cachedInputTokens: 1_000,
  reasoningTokens: 500,
};

test("buildOpenAICostLedgerInsert stores token usage and estimate without raw evidence", () => {
  const row = buildOpenAICostLedgerInsert({
    id: "oaic_1",
    aiRunId: "air_1",
    teamId: "team_1",
    propertyId: "prop_1",
    refreshJobId: "job_1",
    callPurpose: "gsc_source_summary",
    model: "gpt-5-mini",
    usage,
    requestId: "req_123",
    outcome: "succeeded",
  });

  assert.equal(row.costEstimateUsd, "0.006500");
  assert.equal(row.inputTokens, 10_000);
  assert.equal(row.outputTokens, 2_000);
  assert.equal(row.totalTokens, 12_000);
  assert.equal(row.cachedInputTokens, 1_000);
  assert.equal(row.reasoningTokens, 500);
  assert.equal(row.rawUsage, undefined);
});

test("summarizeOpenAICostLedgerRows separates successful and failed spend", () => {
  const summary = summarizeOpenAICostLedgerRows([
    { outcome: "succeeded", costEstimateUsd: "0.010000", usageSnapshot: { inputTokens: 1, outputTokens: 2 } },
    { outcome: "failed", costEstimateUsd: "0.020000", usageSnapshot: { inputTokens: 3, totalTokens: 7 } },
    { outcome: "partial", costEstimateUsd: "0.030000", usageSnapshot: { outputTokens: 4, cachedInputTokens: 5 } },
  ]);

  assert.equal(summary.successfulEstimateUsd, 0.01);
  assert.equal(summary.failedEstimateUsd, 0.05);
  assert.equal(summary.totalEstimateUsd, 0.06);
  assert.deepEqual(summary.usageSnapshot, {
    inputTokens: 4,
    outputTokens: 6,
    totalTokens: 7,
    cachedInputTokens: 5,
    reasoningTokens: 0,
  });
});

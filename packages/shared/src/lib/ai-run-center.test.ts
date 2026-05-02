import test from "node:test";
import assert from "node:assert/strict";
import { buildAiRunCenterCounts } from "./ai-run-center.logic";

test("buildAiRunCenterCounts summarizes run status and estimated cost", () => {
  const summary = buildAiRunCenterCounts([
    { status: "queued", costEstimateUsd: "0.010000" },
    { status: "processing", costEstimateUsd: "0.020000" },
    { status: "complete", costEstimateUsd: "0.030000" },
    { status: "failed", costEstimateUsd: null },
  ]);

  assert.deepEqual(summary, {
    counts: {
      queued: 1,
      processing: 1,
      complete: 1,
      failed: 1,
      total: 4,
    },
    estimatedCostUsd: 0.06,
  });
});

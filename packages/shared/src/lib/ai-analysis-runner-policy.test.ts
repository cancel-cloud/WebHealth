import assert from "node:assert/strict";
import test from "node:test";

import { resolveAiAnalysisRunConflictAction } from "./ai-analysis";

test("resolveAiAnalysisRunConflictAction reuses completed and processing runs", () => {
  assert.equal(resolveAiAnalysisRunConflictAction("complete"), "reuse");
  assert.equal(resolveAiAnalysisRunConflictAction("processing"), "reuse");
});

test("resolveAiAnalysisRunConflictAction retries failed runs", () => {
  assert.equal(resolveAiAnalysisRunConflictAction("failed"), "retry");
  assert.equal(resolveAiAnalysisRunConflictAction("queued"), "retry");
});

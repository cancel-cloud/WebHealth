import assert from "node:assert/strict";
import test from "node:test";
import { buildRerunAllResponse, normalizeRerunAllRequestBody } from "./route.logic";

test("normalizeRerunAllRequestBody keeps the current dashboard window", () => {
  assert.deepEqual(
    normalizeRerunAllRequestBody({
      preset: "custom",
      compareMode: "none",
      startDate: "2026-03-01",
      endDate: "2026-03-28",
      compareStartDate: null,
      compareEndDate: null,
    }),
    {
      preset: "custom",
      compareMode: "none",
      startDate: "2026-03-01",
      endDate: "2026-03-28",
      compareStartDate: null,
      compareEndDate: null,
    },
  );
});

test("buildRerunAllResponse degrades instead of crashing when source refresh fails", () => {
  const response = buildRerunAllResponse({
    dataRefresh: { status: "failed", message: "Google account not linked" },
    crawlRefresh: { status: "queued", jobId: "prj_123" },
    decisionRefresh: { status: "queued", jobId: "prj_456" },
  });

  assert.equal(response.status, "partial");
  assert.deepEqual(response.warnings, ["Google account not linked"]);
});

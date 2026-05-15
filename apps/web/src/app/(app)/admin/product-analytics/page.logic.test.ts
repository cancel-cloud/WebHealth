import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActualSpendSeries,
  buildActualSpendSummary,
  buildEstimatedSpendSeries,
  buildEstimatedSpendSummary,
  buildJobThroughputSeries,
} from "./page.logic";

test("buildActualSpendSummary totals actual OpenAI billing rows", () => {
  assert.equal(
    buildActualSpendSummary([
      { sourceDate: "2026-04-01", totalUsd: "1.500000" },
      { sourceDate: "2026-04-02", totalUsd: "2.250000" },
      { sourceDate: "2026-04-03", totalUsd: null },
    ]),
    "3.750000",
  );
});

test("buildActualSpendSeries sorts imported OpenAI billing by day", () => {
  assert.deepEqual(
    buildActualSpendSeries([
      { sourceDate: "2026-04-02", totalUsd: "2.250000" },
      { sourceDate: "2026-04-01", totalUsd: "1.500000" },
    ]),
    [
      { date: "2026-04-01", totalUsd: 1.5 },
      { date: "2026-04-02", totalUsd: 2.25 },
    ],
  );
});

test("buildEstimatedSpendSummary totals AI run cost estimates", () => {
  assert.equal(
    buildEstimatedSpendSummary([
      { sourceDate: "2026-05-13", totalUsd: "0.054441" },
      { sourceDate: "2026-05-15", totalUsd: "0.024664" },
    ]),
    "0.079105",
  );
});

test("buildEstimatedSpendSeries sorts AI run estimates by day", () => {
  assert.deepEqual(
    buildEstimatedSpendSeries([
      { sourceDate: "2026-05-15", totalUsd: "0.024664" },
      { sourceDate: "2026-05-13", totalUsd: "0.054441" },
    ]),
    [
      { date: "2026-05-13", totalUsd: 0.054441 },
      { date: "2026-05-15", totalUsd: 0.024664 },
    ],
  );
});

test("buildJobThroughputSeries groups jobs by current snapshot pipeline families", () => {
  const series = buildJobThroughputSeries([
    { family: "source_data", status: "complete", count: 2 },
    { family: "source_data", status: "failed", count: 1 },
    { family: "property_refresh", status: "queued", count: 3 },
    { family: "snapshot", status: "complete", count: 4 },
  ]);

  assert.deepEqual(series, [
    { family: "Source data", queued: 0, processing: 0, complete: 2, failed: 1, partial: 0 },
    { family: "Property refresh", queued: 3, processing: 0, complete: 0, failed: 0, partial: 0 },
    { family: "Snapshots", queued: 0, processing: 0, complete: 4, failed: 0, partial: 0 },
  ]);
});

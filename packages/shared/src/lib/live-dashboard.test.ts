import assert from "node:assert/strict";
import test from "node:test";
import { resolveAnalysisWindow } from "./live-dashboard";

test("resolveAnalysisWindow defaults to a safe 28-day window with previous-period comparison", () => {
  const window = resolveAnalysisWindow({
    safeLatestDate: "2026-04-20",
  });

  assert.deepEqual(window, {
    preset: "last_28d",
    compareMode: "previous_period",
    startDate: "2026-03-24",
    endDate: "2026-04-20",
    requestedEndDate: "2026-04-20",
    compareStartDate: "2026-02-24",
    compareEndDate: "2026-03-23",
  });
});

test("resolveAnalysisWindow keeps custom dates and shifts compare window to the prior year when requested", () => {
  const window = resolveAnalysisWindow({
    preset: "custom",
    compareMode: "same_period_last_year",
    startDate: "2026-01-10",
    endDate: "2026-02-04",
    safeLatestDate: "2026-04-20",
  });

  assert.deepEqual(window, {
    preset: "custom",
    compareMode: "same_period_last_year",
    startDate: "2026-01-10",
    endDate: "2026-02-04",
    requestedEndDate: "2026-02-04",
    compareStartDate: "2025-01-10",
    compareEndDate: "2025-02-04",
  });
});

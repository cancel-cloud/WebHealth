import assert from "node:assert/strict";
import test from "node:test";

import {
  planMetricsRefreshWindows,
  validateMetricsRefreshWindow,
} from "./metrics-window-policy";

test("validateMetricsRefreshWindow accepts windows up to ninety inclusive days", () => {
  assert.deepEqual(validateMetricsRefreshWindow({ dateStart: "2026-01-01", dateEnd: "2026-01-07" }), {
    ok: true,
    days: 7,
  });
  assert.deepEqual(validateMetricsRefreshWindow({ dateStart: "2026-01-01", dateEnd: "2026-01-28" }), {
    ok: true,
    days: 28,
  });
  assert.deepEqual(validateMetricsRefreshWindow({ dateStart: "2026-01-01", dateEnd: "2026-03-31" }), {
    ok: true,
    days: 90,
  });
});

test("validateMetricsRefreshWindow rejects invalid, reversed, and oversized windows", () => {
  assert.equal(validateMetricsRefreshWindow({ dateStart: "2026-02-30", dateEnd: "2026-03-01" }).ok, false);
  assert.equal(validateMetricsRefreshWindow({ dateStart: "2026-03-02", dateEnd: "2026-03-01" }).ok, false);
  assert.equal(validateMetricsRefreshWindow({ dateStart: "2026-01-01", dateEnd: "2026-04-01" }).ok, false);
});

test("planMetricsRefreshWindows merges adjacent windows and splits non-contiguous comparison windows", () => {
  assert.deepEqual(
    planMetricsRefreshWindows({
      startDate: "2026-03-01",
      endDate: "2026-03-28",
      compareStartDate: "2026-02-01",
      compareEndDate: "2026-02-28",
    }),
    [{ dateStart: "2026-02-01", dateEnd: "2026-03-28" }],
  );

  assert.deepEqual(
    planMetricsRefreshWindows({
      startDate: "2026-03-01",
      endDate: "2026-03-28",
      compareStartDate: "2025-03-01",
      compareEndDate: "2025-03-28",
    }),
    [
      { dateStart: "2025-03-01", dateEnd: "2025-03-28" },
      { dateStart: "2026-03-01", dateEnd: "2026-03-28" },
    ],
  );
});

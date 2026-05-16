import assert from "node:assert/strict";
import test from "node:test";

import { resolveMetricsBackfillWorkerConcurrency } from "./metrics-cache";
import { resolvePropertyRefreshWorkerConcurrency } from "./property-refresh-worker";

test("worker concurrency parsing keeps defaults bounded for a small VPS", () => {
  assert.equal(resolvePropertyRefreshWorkerConcurrency({ value: undefined, fallback: 1 }), 1);
  assert.equal(resolvePropertyRefreshWorkerConcurrency({ value: "2", fallback: 1 }), 2);
  assert.equal(resolvePropertyRefreshWorkerConcurrency({ value: "0", fallback: 1 }), 1);
  assert.equal(resolvePropertyRefreshWorkerConcurrency({ value: "99", fallback: 1, max: 4 }), 4);

  assert.equal(resolveMetricsBackfillWorkerConcurrency({ value: undefined, fallback: 2 }), 2);
  assert.equal(resolveMetricsBackfillWorkerConcurrency({ value: "3", fallback: 2 }), 3);
  assert.equal(resolveMetricsBackfillWorkerConcurrency({ value: "bad", fallback: 2 }), 2);
  assert.equal(resolveMetricsBackfillWorkerConcurrency({ value: "8", fallback: 2, max: 4 }), 4);
});

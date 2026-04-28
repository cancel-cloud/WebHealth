import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWorkerReadinessSnapshot,
  createWorkerRuntimeState,
  markDatabaseReady,
  markLoopTick,
  markWorkerPhase,
} from "./runtime-state";

test("worker readiness stays false until the queue loop has started ticking", () => {
  const state = createWorkerRuntimeState();

  markWorkerPhase(state, "database-ready", 100);
  markDatabaseReady(state, 110);

  const snapshot = buildWorkerReadinessSnapshot(state, { nowMs: 150, staleAfterMs: 1_000 });

  assert.equal(snapshot.ok, false);
  assert.equal(snapshot.reason, "worker_loop_not_started");
});

test("worker readiness is true after the queue loop starts ticking", () => {
  const state = createWorkerRuntimeState();

  markWorkerPhase(state, "worker-loop", 100);
  markDatabaseReady(state, 110);
  markLoopTick(state, 120);

  const ready = buildWorkerReadinessSnapshot(state, { nowMs: 150, staleAfterMs: 1_000 });
  assert.equal(ready.ok, true);
  assert.equal(ready.reason, null);
});

test("worker readiness turns false when the queue loop heartbeat is stale", () => {
  const state = createWorkerRuntimeState();

  markWorkerPhase(state, "worker-loop", 100);
  markDatabaseReady(state, 110);
  markLoopTick(state, 120);

  const snapshot = buildWorkerReadinessSnapshot(state, { nowMs: 2_000, staleAfterMs: 500 });

  assert.equal(snapshot.ok, false);
  assert.equal(snapshot.reason, "worker_loop_stale");
});

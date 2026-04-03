import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWorkerReadinessSnapshot,
  createWorkerRuntimeState,
  markArtifactServerListening,
  markDatabaseReady,
  markLoopTick,
  markWorkerPhase,
} from "./runtime-state";

test("worker readiness stays false until the queue loop has started ticking", () => {
  const state = createWorkerRuntimeState({ artifactServerExpected: false });

  markWorkerPhase(state, "database-ready", 100);
  markDatabaseReady(state, 110);

  const snapshot = buildWorkerReadinessSnapshot(state, { nowMs: 150, staleAfterMs: 1_000 });

  assert.equal(snapshot.ok, false);
  assert.equal(snapshot.reason, "worker_loop_not_started");
});

test("worker readiness requires artifact server readiness when downloads are enabled", () => {
  const state = createWorkerRuntimeState({ artifactServerExpected: true });

  markWorkerPhase(state, "worker-loop", 100);
  markDatabaseReady(state, 110);
  markLoopTick(state, 120);

  const beforeArtifact = buildWorkerReadinessSnapshot(state, {
    nowMs: 150,
    staleAfterMs: 1_000,
  });
  assert.equal(beforeArtifact.ok, false);
  assert.equal(beforeArtifact.reason, "artifact_server_not_ready");

  markArtifactServerListening(state, 140);

  const ready = buildWorkerReadinessSnapshot(state, { nowMs: 150, staleAfterMs: 1_000 });
  assert.equal(ready.ok, true);
  assert.equal(ready.reason, null);
});

test("worker readiness turns false when the queue loop heartbeat is stale", () => {
  const state = createWorkerRuntimeState({ artifactServerExpected: false });

  markWorkerPhase(state, "worker-loop", 100);
  markDatabaseReady(state, 110);
  markLoopTick(state, 120);

  const snapshot = buildWorkerReadinessSnapshot(state, { nowMs: 2_000, staleAfterMs: 500 });

  assert.equal(snapshot.ok, false);
  assert.equal(snapshot.reason, "worker_loop_stale");
});

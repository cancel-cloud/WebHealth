import assert from "node:assert/strict";
import test from "node:test";

import { startWorkerHealthServer } from "./health-server";
import {
  createWorkerRuntimeState,
  markDatabaseReady,
  markLoopTick,
  markWorkerPhase,
} from "./runtime-state";

async function fetchLocal(port: number, path: string) {
  return fetch(`http://127.0.0.1:${port}${path}`);
}

test("worker health server returns 503 for readiness before the worker loop ticks", async () => {
  const state = createWorkerRuntimeState();
  markWorkerPhase(state, "database-ready", 100);
  markDatabaseReady(state, 110);

  const server = startWorkerHealthServer({
    state,
    host: "127.0.0.1",
    port: 19100,
    staleAfterMs: 1_000,
  });

  try {
    const response = await fetchLocal(server.port, "/ready");
    assert.equal(response.status, 503);
    assert.match(await response.text(), /worker_loop_not_started/);
  } finally {
    await server.close();
  }
});

test("worker health server returns OK once the worker loop is ready", async () => {
  const state = createWorkerRuntimeState();
  markWorkerPhase(state, "worker-loop", 100);
  markDatabaseReady(state, 110);
  markLoopTick(state, Date.now());

  const server = startWorkerHealthServer({
    state,
    host: "127.0.0.1",
    port: 19101,
    staleAfterMs: 1_000,
  });

  try {
    const response = await fetchLocal(server.port, "/ready");
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "OK\n");
  } finally {
    await server.close();
  }
});

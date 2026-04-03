import assert from "node:assert/strict";
import test from "node:test";

import { resolveWorkerEnvSearchPaths } from "./runtime-paths";

test("resolveWorkerEnvSearchPaths returns source roots for source module paths", () => {
  const paths = resolveWorkerEnvSearchPaths("/repo/apps/worker/src");

  assert.deepEqual(paths.workerRoots, ["/repo/apps/worker"]);
  assert.deepEqual(paths.repoRoots, ["/repo"]);
});

test("resolveWorkerEnvSearchPaths adds source fallbacks for dist module paths", () => {
  const paths = resolveWorkerEnvSearchPaths("/repo/dist/apps/worker/src");

  assert.deepEqual(paths.workerRoots, ["/repo/dist/apps/worker", "/repo/apps/worker"]);
  assert.deepEqual(paths.repoRoots, ["/repo/dist", "/repo"]);
});

test("resolveWorkerEnvSearchPaths supports chunk paths inside dist bundles", () => {
  const paths = resolveWorkerEnvSearchPaths("/repo/dist/apps/worker/src/chunks");

  assert.deepEqual(paths.workerRoots, ["/repo/dist/apps/worker", "/repo/apps/worker"]);
  assert.deepEqual(paths.repoRoots, ["/repo/dist", "/repo"]);
});

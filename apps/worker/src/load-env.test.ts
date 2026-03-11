import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { tmpdir } from "node:os";

import { loadWorkerEnv } from "./load-env";

test("worker-local env overrides repo root fallback values", () => {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "webhealth-worker-env-"));
  const repoRoot = path.join(tempRoot, "repo");
  const workerRoot = path.join(repoRoot, "apps", "worker");
  mkdirSync(workerRoot, { recursive: true });

  writeFileSync(path.join(repoRoot, ".env.local"), [
    "DATABASE_URL=postgresql://root:pass@localhost:5432/webhealth",
    "BETTER_AUTH_URL=https://root.example.test",
  ].join("\n"));

  writeFileSync(path.join(workerRoot, ".env.local"), [
    "DATABASE_URL=postgresql://worker:pass@ep-worker-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    "DIRECT_DATABASE_URL=postgresql://worker:pass@ep-worker.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  ].join("\n"));

  const env: NodeJS.ProcessEnv = {};

  try {
    loadWorkerEnv({ env, repoRoot, workerRoot });

    assert.equal(
      env.DATABASE_URL,
      "postgresql://worker:pass@ep-worker-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    );
    assert.equal(env.BETTER_AUTH_URL, "https://root.example.test");
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

import {
  getArtifactStore
} from "./chunks/chunk-YZNPJFVX.js";
import "./chunks/chunk-3LHI6BO3.js";

// apps/worker/src/artifact-server.ts
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

// packages/shared/src/lib/artifact-token.ts
import { createHmac, timingSafeEqual } from "node:crypto";
function getArtifactTokenSecret() {
  const secret = process.env.ARTIFACT_TOKEN_SECRET?.trim();
  if (!secret) {
    throw new Error("ARTIFACT_TOKEN_SECRET is required");
  }
  return secret;
}
function signSegment(encodedPayload) {
  return createHmac("sha256", getArtifactTokenSecret()).update(encodedPayload).digest("base64url");
}
function verifyArtifactDownloadToken(token) {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = signSegment(encodedPayload);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(provided, expectedBuffer)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!parsed?.artifactKey || !parsed?.reportId || typeof parsed?.exp !== "number") {
      return null;
    }
    if (parsed.exp < Math.floor(Date.now() / 1e3)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// apps/worker/src/runtime-state.ts
function createWorkerRuntimeState(input) {
  return {
    artifactServerExpected: input?.artifactServerExpected ?? false,
    phase: "boot",
    databaseReadyAtMs: null,
    artifactServerListeningAtMs: null,
    loopStartedAtMs: null,
    lastLoopTickAtMs: null,
    shuttingDownAtMs: null,
    fatalErrorAtMs: null,
    fatalErrorMessage: null,
    currentJobId: null,
    currentJobStartedAtMs: null
  };
}
function markWorkerPhase(state, phase, nowMs = Date.now()) {
  state.phase = phase;
  if (phase === "shutdown" && state.shuttingDownAtMs == null) {
    state.shuttingDownAtMs = nowMs;
  }
}
function markDatabaseReady(state, nowMs = Date.now()) {
  state.databaseReadyAtMs = nowMs;
}
function markArtifactServerListening(state, nowMs = Date.now()) {
  state.artifactServerListeningAtMs = nowMs;
}
function markLoopTick(state, nowMs = Date.now()) {
  if (state.loopStartedAtMs == null) {
    state.loopStartedAtMs = nowMs;
  }
  state.lastLoopTickAtMs = nowMs;
}
function markShutdownRequested(state, nowMs = Date.now()) {
  state.shuttingDownAtMs = nowMs;
  state.phase = "shutdown";
}
function markFatalError(state, error, nowMs = Date.now()) {
  state.fatalErrorAtMs = nowMs;
  state.fatalErrorMessage = error instanceof Error ? error.message : String(error);
}
function markJobStart(state, input) {
  state.currentJobId = input.jobId;
  state.currentJobStartedAtMs = input.nowMs ?? Date.now();
}
function markJobEnd(state) {
  state.currentJobId = null;
  state.currentJobStartedAtMs = null;
}
function buildWorkerReadinessSnapshot(state, input) {
  const nowMs = input?.nowMs ?? Date.now();
  const staleAfterMs = input?.staleAfterMs ?? 6e4;
  let reason = null;
  if (state.fatalErrorAtMs != null) {
    reason = "fatal_error";
  } else if (state.shuttingDownAtMs != null) {
    reason = "shutting_down";
  } else if (state.lastLoopTickAtMs == null) {
    reason = "worker_loop_not_started";
  } else if (state.artifactServerExpected && state.artifactServerListeningAtMs == null) {
    reason = "artifact_server_not_ready";
  } else if (nowMs - state.lastLoopTickAtMs > staleAfterMs) {
    reason = "worker_loop_stale";
  }
  return {
    ok: reason == null,
    phase: state.phase,
    reason,
    databaseReadyAtMs: state.databaseReadyAtMs,
    artifactServerExpected: state.artifactServerExpected,
    artifactServerListeningAtMs: state.artifactServerListeningAtMs,
    lastLoopTickAtMs: state.lastLoopTickAtMs,
    currentJobId: state.currentJobId,
    currentJobStartedAtMs: state.currentJobStartedAtMs
  };
}

// apps/worker/src/artifact-server.ts
var PORT = parseInt(process.env.WORKER_HTTP_PORT ?? "9100", 10);
function isValidArtifactKey(key) {
  if (!key || key.includes("..") || key.startsWith("/") || key.includes("\\")) {
    return false;
  }
  return /^reports\/[a-zA-Z0-9_-]+\/\d+-[a-zA-Z0-9._-]+$/.test(key);
}
function extractReportIdFromArtifactKey(key) {
  const match = key.match(/^reports\/([a-zA-Z0-9_-]+)\//);
  return match?.[1] ?? null;
}
function buildWorkerHealthResponse(state, input) {
  const readiness = buildWorkerReadinessSnapshot(state, input);
  return {
    statusCode: readiness.reason === "fatal_error" || readiness.reason === "shutting_down" ? 503 : 200,
    body: {
      ok: readiness.reason !== "fatal_error" && readiness.reason !== "shutting_down",
      ready: readiness.ok,
      phase: readiness.phase,
      reason: readiness.reason,
      currentJobId: readiness.currentJobId
    }
  };
}
function buildWorkerReadyResponse(state, input) {
  const readiness = buildWorkerReadinessSnapshot(state, input);
  return {
    statusCode: readiness.ok ? 200 : 503,
    body: readiness
  };
}
async function startArtifactServer(input) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    if (req.method === "GET" && url.pathname === "/health") {
      if (input?.getRuntimeState) {
        const response = buildWorkerHealthResponse(input.getRuntimeState(), {
          staleAfterMs: input.staleAfterMs
        });
        res.writeHead(response.statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response.body));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (req.method === "GET" && url.pathname === "/ready") {
      if (!input?.getRuntimeState) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, ready: true }));
        return;
      }
      const response = buildWorkerReadyResponse(input.getRuntimeState(), {
        staleAfterMs: input.staleAfterMs
      });
      res.writeHead(response.statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response.body));
      return;
    }
    if (req.method !== "GET" || url.pathname !== "/artifacts") {
      res.writeHead(405);
      res.end("Method Not Allowed");
      return;
    }
    const token = url.searchParams.get("token");
    const verified = token ? verifyArtifactDownloadToken(token) : null;
    if (!verified) {
      console.warn("[artifact-server][WARN][AUTH] unauthorized artifact request");
      res.writeHead(401);
      res.end("Unauthorized");
      return;
    }
    const key = verified.artifactKey;
    if (!key || !isValidArtifactKey(key)) {
      console.warn(`[artifact-server][WARN][REQUEST] invalid artifact key key=${key ?? "missing"}`);
      res.writeHead(400);
      res.end("Invalid artifact key");
      return;
    }
    const reportId = extractReportIdFromArtifactKey(key) ?? "unknown";
    if (reportId !== verified.reportId) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    console.log(`[artifact-server][INFO][REQUEST] download requested reportId=${reportId} key=${key}`);
    try {
      const ref = await getArtifactStore().getDownloadRef(key);
      if (!ref.path) {
        console.warn(`[artifact-server][WARN][NOT_FOUND] reportId=${reportId} key=${key}`);
        res.writeHead(404);
        res.end("Artifact not found");
        return;
      }
      const fileStat = await stat(ref.path);
      console.log(
        `[artifact-server][INFO][STREAM] reportId=${reportId} key=${key} bytes=${fileStat.size}`
      );
      res.writeHead(200, {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Length": fileStat.size
      });
      createReadStream(ref.path).pipe(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown-error";
      console.warn(
        `[artifact-server][WARN][ERROR] reportId=${reportId} key=${key} error=${message}`
      );
      res.writeHead(404);
      res.end("Artifact not found");
    }
  });
  await new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`[artifact-server] listening on port ${PORT}`);
      resolve();
    });
    server.on("error", reject);
  });
  return {
    async stop() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  };
}

// apps/worker/src/load-env.ts
import { existsSync } from "node:fs";
import path2 from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

// apps/worker/src/runtime-paths.ts
import path from "node:path";
function findDistRoot(moduleDir) {
  let current = moduleDir;
  while (true) {
    if (path.basename(current) === "dist") {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}
function resolveWorkerEnvSearchPaths(moduleDir) {
  const distRoot = findDistRoot(moduleDir);
  if (distRoot) {
    const sourceRepoRoot = path.dirname(distRoot);
    return {
      workerRoots: [
        path.join(distRoot, "apps", "worker"),
        path.join(sourceRepoRoot, "apps", "worker")
      ],
      repoRoots: [distRoot, sourceRepoRoot]
    };
  }
  const workerRoot = path.resolve(moduleDir, "..");
  const repoRoot = path.resolve(moduleDir, "../../..");
  return {
    workerRoots: [workerRoot],
    repoRoots: [repoRoot]
  };
}

// apps/worker/src/load-env.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var defaultWorkerRoot = path2.resolve(__dirname, "..");
var defaultRepoRoot = path2.resolve(__dirname, "../../..");
function loadIfExists(filePath, env) {
  if (!existsSync(filePath)) return;
  loadDotenv({ path: filePath, override: false, processEnv: env });
}
function loadWorkerEnv({
  env = process.env,
  repoRoot,
  workerRoot
} = {}) {
  const explicitFile = env.WORKER_ENV_FILE;
  if (explicitFile) {
    loadIfExists(path2.resolve(explicitFile), env);
  }
  const searchPaths = resolveWorkerEnvSearchPaths(__dirname);
  const workerRoots = workerRoot ? [workerRoot] : searchPaths.workerRoots;
  const repoRoots = repoRoot ? [repoRoot] : searchPaths.repoRoots;
  for (const root of workerRoots) {
    loadIfExists(path2.join(root, ".env.local"), env);
    loadIfExists(path2.join(root, ".env"), env);
  }
  for (const root of repoRoots) {
    loadIfExists(path2.join(root, ".env.local"), env);
    loadIfExists(path2.join(root, ".env"), env);
  }
  if (!env.DATABASE_URL) {
    throw new Error("DB_CONFIG_ERROR: DATABASE_URL is required for worker runtime.");
  }
}

// apps/worker/src/monitoring.ts
import * as Sentry from "@sentry/node";
function initWorkerMonitoring(env = process.env) {
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return;
  Sentry.init({
    dsn,
    enabled: true,
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: env.SENTRY_RELEASE,
    tracesSampleRate: 0,
    sendDefaultPii: false
  });
}
async function reportWorkerFatalError(error, context, env = process.env) {
  if (!env.SENTRY_DSN?.trim()) return;
  Sentry.withScope((scope) => {
    scope.setTag("error_surface", "worker");
    scope.setTag("worker_phase", context.phase);
    scope.setLevel("fatal");
    scope.setContext("worker_failure", context);
    Sentry.captureException(error);
  });
  await Sentry.close(2e3);
}

// apps/worker/src/runtime-watchdog.ts
function shouldForceExitForStuckJob(input) {
  if (input.currentJobStartedAtMs == null) return false;
  return input.nowMs - input.currentJobStartedAtMs > input.maxJobRuntimeMs;
}

// apps/worker/src/main.ts
loadWorkerEnv();
initWorkerMonitoring();
var runtimeState = createWorkerRuntimeState({
  artifactServerExpected: !!process.env.ARTIFACT_TOKEN_SECRET
});
var workerPhase = "boot";
async function main() {
  let artifactServer = null;
  let workerLoopControls = null;
  let propertyRefreshWorkerControls = null;
  let weeklyReviewSchedulerControls = null;
  let closeDb = null;
  let watchdogTimer = null;
  let shutdownPromise = null;
  const once = process.argv.includes("--once");
  const readinessStaleAfterMs = parseInt(
    process.env.WORKER_READY_STALE_AFTER_MS ?? "45000",
    10
  );
  const maxJobRuntimeMs = parseInt(
    process.env.REPORT_WORKER_MAX_JOB_RUNTIME_MS ?? "900000",
    10
  );
  const watchdogIntervalMs = parseInt(
    process.env.REPORT_WORKER_WATCHDOG_INTERVAL_MS ?? "5000",
    10
  );
  const requestShutdown = async (exitCode, reason) => {
    if (shutdownPromise) return shutdownPromise;
    markShutdownRequested(runtimeState);
    console.warn(`[report-worker][WARN][SHUTDOWN] stopping worker reason=${reason}`);
    shutdownPromise = (async () => {
      if (watchdogTimer) {
        clearInterval(watchdogTimer);
        watchdogTimer = null;
      }
      workerLoopControls?.stop();
      propertyRefreshWorkerControls?.stop();
      weeklyReviewSchedulerControls?.stop();
      await Promise.allSettled([
        artifactServer?.stop() ?? Promise.resolve(),
        closeDb?.() ?? Promise.resolve()
      ]);
      process.exit(exitCode);
    })();
    return shutdownPromise;
  };
  process.once("SIGTERM", () => {
    void requestShutdown(0, "SIGTERM");
  });
  process.once("SIGINT", () => {
    void requestShutdown(0, "SIGINT");
  });
  workerPhase = "imports";
  markWorkerPhase(runtimeState, "imports");
  const sharedDbModule = await import("./chunks/db-HVTMHZPE.js");
  const { ensureWorkerDatabaseReady } = await import("./chunks/worker-db-bootstrap-O6DFN672.js");
  const { startReportWorkerLoop, runSingleReportWorkerTick } = await import("./chunks/report-worker-GPBRKYUE.js");
  const { startPropertyRefreshWorkerLoop } = await import("./chunks/property-refresh-worker-AI6CT45N.js");
  const { startWeeklyReviewScheduler } = await import("./chunks/weekly-review-scheduler-QNQHRJTL.js");
  closeDb = sharedDbModule.closeDb;
  workerPhase = "database-ready";
  markWorkerPhase(runtimeState, "database-ready");
  await ensureWorkerDatabaseReady();
  markDatabaseReady(runtimeState);
  if (!once && process.env.ARTIFACT_TOKEN_SECRET) {
    workerPhase = "artifact-server";
    markWorkerPhase(runtimeState, "artifact-server");
    artifactServer = await startArtifactServer({
      getRuntimeState: () => runtimeState,
      staleAfterMs: readinessStaleAfterMs
    });
    markArtifactServerListening(runtimeState);
  } else if (!once) {
    console.warn("[report-worker][WARN][BOOT] ARTIFACT_TOKEN_SECRET not set; artifact HTTP server disabled");
  }
  if (once) {
    workerPhase = "single-tick";
    markWorkerPhase(runtimeState, "single-tick");
    const result = await runSingleReportWorkerTick(void 0, {
      onFatalError: ({ error, nowMs }) => markFatalError(runtimeState, error, nowMs),
      onJobEnd: () => markJobEnd(runtimeState),
      onJobStart: ({ jobId, nowMs }) => markJobStart(runtimeState, { jobId, nowMs }),
      onLoopTick: ({ nowMs }) => markLoopTick(runtimeState, nowMs)
    });
    if (result.processed) {
      console.log(`[report-worker][INFO][WORKING] single tick processed job jobId=${result.jobId}`);
    } else {
      console.log("[report-worker][INFO][IDLE] single tick found no claimable jobs");
    }
    await requestShutdown(0, "once-complete");
  }
  workerPhase = "worker-loop";
  markWorkerPhase(runtimeState, "worker-loop");
  console.log("[report-worker][INFO][BOOT] starting worker process");
  weeklyReviewSchedulerControls = startWeeklyReviewScheduler();
  workerLoopControls = startReportWorkerLoop({
    hooks: {
      onFatalError: ({ error, nowMs }) => markFatalError(runtimeState, error, nowMs),
      onJobEnd: () => markJobEnd(runtimeState),
      onJobStart: ({ jobId, nowMs }) => markJobStart(runtimeState, { jobId, nowMs }),
      onLoopTick: ({ nowMs }) => markLoopTick(runtimeState, nowMs)
    }
  });
  propertyRefreshWorkerControls = startPropertyRefreshWorkerLoop();
  watchdogTimer = setInterval(() => {
    if (shouldForceExitForStuckJob({
      currentJobStartedAtMs: runtimeState.currentJobStartedAtMs,
      nowMs: Date.now(),
      maxJobRuntimeMs
    })) {
      const error = new Error(
        `Worker job exceeded max runtime of ${maxJobRuntimeMs}ms and will be restarted`
      );
      markFatalError(runtimeState, error);
      console.error("[report-worker][FATAL][FATAL] stuck job watchdog triggered", error);
      void requestShutdown(1, "stuck-job-watchdog");
    }
  }, watchdogIntervalMs);
}
main().catch(async (error) => {
  markFatalError(runtimeState, error);
  await reportWorkerFatalError(error, {
    phase: workerPhase,
    target: workerPhase === "database-ready" ? "direct-database" : "worker-process"
  });
  console.error("[report-worker][FATAL][FATAL] worker process crashed", error);
  process.exit(1);
});

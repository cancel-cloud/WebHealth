import "./chunks/chunk-3LHI6BO3.js";

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

// apps/worker/src/runtime-state.ts
function createWorkerRuntimeState() {
  return {
    phase: "boot",
    databaseReadyAtMs: null,
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
function markShutdownRequested(state, nowMs = Date.now()) {
  state.shuttingDownAtMs = nowMs;
  state.phase = "shutdown";
}
function markFatalError(state, error, nowMs = Date.now()) {
  state.fatalErrorAtMs = nowMs;
  state.fatalErrorMessage = error instanceof Error ? error.message : String(error);
}

// apps/worker/src/runtime-watchdog.ts
function shouldForceExitForStuckJob(input) {
  if (input.currentJobStartedAtMs == null) return false;
  return input.nowMs - input.currentJobStartedAtMs > input.maxJobRuntimeMs;
}

// apps/worker/src/main.ts
loadWorkerEnv();
initWorkerMonitoring();
var runtimeState = createWorkerRuntimeState();
var workerPhase = "boot";
async function main() {
  let propertyRefreshWorkerControls = null;
  let automatedPropertyRefreshWorkerControls = null;
  let metricsBackfillWorkerControls = null;
  let activePropertyAutomationSchedulerControls = null;
  let closeDb = null;
  let watchdogTimer = null;
  let shutdownPromise = null;
  const once = process.argv.includes("--once");
  const maxJobRuntimeMs = parseInt(process.env.WORKER_MAX_JOB_RUNTIME_MS ?? "900000", 10);
  const watchdogIntervalMs = parseInt(
    process.env.WORKER_WATCHDOG_INTERVAL_MS ?? "5000",
    10
  );
  const requestShutdown = async (exitCode, reason) => {
    if (shutdownPromise) return shutdownPromise;
    markShutdownRequested(runtimeState);
    console.warn(`[worker][WARN][SHUTDOWN] stopping worker reason=${reason}`);
    shutdownPromise = (async () => {
      if (watchdogTimer) {
        clearInterval(watchdogTimer);
        watchdogTimer = null;
      }
      propertyRefreshWorkerControls?.stop();
      automatedPropertyRefreshWorkerControls?.stop();
      metricsBackfillWorkerControls?.stop();
      activePropertyAutomationSchedulerControls?.stop();
      await Promise.allSettled([
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
  const sharedDbModule = await import("./chunks/db-ND272BIY.js");
  const { ensureWorkerDatabaseReady } = await import("./chunks/worker-db-bootstrap-KWVAEAVL.js");
  const { startPropertyRefreshWorkerLoop, runSinglePropertyRefreshWorkerTick } = await import("./chunks/property-refresh-worker-5MIROK3O.js");
  const { startMetricsBackfillWorkerLoop, runSingleMetricsBackfillWorkerTick } = await import("./chunks/metrics-cache-HZUWKLA7.js");
  const { startActivePropertyAutomationScheduler } = await import("./chunks/active-property-automation-KT2L6GA6.js");
  closeDb = sharedDbModule.closeDb;
  workerPhase = "database-ready";
  markWorkerPhase(runtimeState, "database-ready");
  await ensureWorkerDatabaseReady();
  markDatabaseReady(runtimeState);
  if (once) {
    workerPhase = "single-tick";
    markWorkerPhase(runtimeState, "single-tick");
    const propertyResult = await runSinglePropertyRefreshWorkerTick();
    const metricsResult = propertyResult.processed ? { processed: false } : await runSingleMetricsBackfillWorkerTick();
    if (propertyResult.processed || metricsResult.processed) {
      console.log("[worker][INFO][WORKING] single tick processed a job");
    } else {
      console.log("[worker][INFO][IDLE] single tick found no claimable jobs");
    }
    await requestShutdown(0, "once-complete");
  }
  workerPhase = "worker-loop";
  markWorkerPhase(runtimeState, "worker-loop");
  console.log("[worker][INFO][BOOT] starting worker process");
  activePropertyAutomationSchedulerControls = startActivePropertyAutomationScheduler();
  metricsBackfillWorkerControls = startMetricsBackfillWorkerLoop();
  propertyRefreshWorkerControls = startPropertyRefreshWorkerLoop({
    lane: "manual",
    workerName: "pref"
  });
  automatedPropertyRefreshWorkerControls = startPropertyRefreshWorkerLoop({
    lane: "automation",
    workerName: "apref",
    intervalMs: parseInt(process.env.AUTOMATED_PROPERTY_REFRESH_WORKER_POLL_MS ?? "6000", 10),
    maxPollMs: parseInt(process.env.AUTOMATED_PROPERTY_REFRESH_WORKER_MAX_POLL_MS ?? "45000", 10)
  });
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
      console.error("[worker][FATAL][FATAL] stuck job watchdog triggered", error);
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
  console.error("[worker][FATAL][FATAL] worker process crashed", error);
  process.exit(1);
});

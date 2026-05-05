import { loadWorkerEnv } from "./load-env";
import { initWorkerMonitoring, reportWorkerFatalError } from "./monitoring";
import {
  createWorkerRuntimeState,
  markDatabaseReady,
  markFatalError,
  markShutdownRequested,
  markWorkerPhase,
} from "./runtime-state";
import { shouldForceExitForStuckJob } from "./runtime-watchdog";

loadWorkerEnv();
initWorkerMonitoring();

const runtimeState = createWorkerRuntimeState();
let workerPhase = "boot";

async function main() {
  let propertyRefreshWorkerControls:
    | ReturnType<
        typeof import("@webhealth/shared/lib/property-refresh-worker")["startPropertyRefreshWorkerLoop"]
      >
    | null = null;
  let automatedPropertyRefreshWorkerControls:
    | ReturnType<
        typeof import("@webhealth/shared/lib/property-refresh-worker")["startPropertyRefreshWorkerLoop"]
      >
    | null = null;
  let metricsBackfillWorkerControls:
    | ReturnType<
        typeof import("@webhealth/shared/lib/metrics-cache")["startMetricsBackfillWorkerLoop"]
      >
    | null = null;
  let activePropertyAutomationSchedulerControls:
    | ReturnType<
        typeof import("@webhealth/shared/lib/active-property-automation")["startActivePropertyAutomationScheduler"]
      >
    | null = null;
  let closeDb: (() => Promise<void>) | null = null;
  let watchdogTimer: NodeJS.Timeout | null = null;
  let shutdownPromise: Promise<never> | null = null;
  const once = process.argv.includes("--once");

  const maxJobRuntimeMs = parseInt(process.env.WORKER_MAX_JOB_RUNTIME_MS ?? "900000", 10);
  const watchdogIntervalMs = parseInt(
    process.env.WORKER_WATCHDOG_INTERVAL_MS ?? "5000",
    10,
  );

  const requestShutdown = async (exitCode: number, reason: string): Promise<never> => {
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
        closeDb?.() ?? Promise.resolve(),
      ]);
      process.exit(exitCode);
    })() as Promise<never>;

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
  const sharedDbModule = await import("@webhealth/shared/db");
  const { ensureWorkerDatabaseReady } = await import("@webhealth/shared/db/worker-db-bootstrap");
  const { startPropertyRefreshWorkerLoop, runSinglePropertyRefreshWorkerTick } = await import(
    "@webhealth/shared/lib/property-refresh-worker"
  );
  const { startMetricsBackfillWorkerLoop, runSingleMetricsBackfillWorkerTick } = await import(
    "@webhealth/shared/lib/metrics-cache"
  );
  const { startActivePropertyAutomationScheduler } = await import(
    "@webhealth/shared/lib/active-property-automation"
  );
  closeDb = sharedDbModule.closeDb;

  workerPhase = "database-ready";
  markWorkerPhase(runtimeState, "database-ready");
  await ensureWorkerDatabaseReady();
  markDatabaseReady(runtimeState);

  if (once) {
    workerPhase = "single-tick";
    markWorkerPhase(runtimeState, "single-tick");
    const propertyResult = await runSinglePropertyRefreshWorkerTick();
    const metricsResult = propertyResult.processed ? { processed: false as const } : await runSingleMetricsBackfillWorkerTick();
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
    workerName: "pref",
  });
  automatedPropertyRefreshWorkerControls = startPropertyRefreshWorkerLoop({
    lane: "automation",
    workerName: "apref",
    intervalMs: parseInt(process.env.AUTOMATED_PROPERTY_REFRESH_WORKER_POLL_MS ?? "6000", 10),
    maxPollMs: parseInt(process.env.AUTOMATED_PROPERTY_REFRESH_WORKER_MAX_POLL_MS ?? "45000", 10),
  });

  watchdogTimer = setInterval(() => {
    if (
      shouldForceExitForStuckJob({
        currentJobStartedAtMs: runtimeState.currentJobStartedAtMs,
        nowMs: Date.now(),
        maxJobRuntimeMs,
      })
    ) {
      const error = new Error(
        `Worker job exceeded max runtime of ${maxJobRuntimeMs}ms and will be restarted`,
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
    target: workerPhase === "database-ready" ? "direct-database" : "worker-process",
  });
  console.error("[worker][FATAL][FATAL] worker process crashed", error);
  process.exit(1);
});

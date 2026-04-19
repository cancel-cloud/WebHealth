import { startArtifactServer } from "./artifact-server";
import { loadWorkerEnv } from "./load-env";
import { initWorkerMonitoring, reportWorkerFatalError } from "./monitoring";
import {
  createWorkerRuntimeState,
  markArtifactServerListening,
  markDatabaseReady,
  markFatalError,
  markJobEnd,
  markJobStart,
  markLoopTick,
  markShutdownRequested,
  markWorkerPhase,
} from "./runtime-state";
import { shouldForceExitForStuckJob } from "./runtime-watchdog";

loadWorkerEnv();
initWorkerMonitoring();

const runtimeState = createWorkerRuntimeState({
  artifactServerExpected: !!process.env.ARTIFACT_TOKEN_SECRET,
});
let workerPhase = "boot";

async function main() {
  let artifactServer: Awaited<ReturnType<typeof startArtifactServer>> | null = null;
  let workerLoopControls:
    | ReturnType<
        typeof import("@webhealth/shared/lib/queue/report-worker")["startReportWorkerLoop"]
      >
    | null = null;
  let weeklyReviewSchedulerControls:
    | ReturnType<
        typeof import("@webhealth/shared/lib/weekly-review-scheduler")["startWeeklyReviewScheduler"]
      >
    | null = null;
  let closeDb: (() => Promise<void>) | null = null;
  let watchdogTimer: NodeJS.Timeout | null = null;
  let shutdownPromise: Promise<never> | null = null;
  const once = process.argv.includes("--once");

  const readinessStaleAfterMs = parseInt(
    process.env.WORKER_READY_STALE_AFTER_MS ?? "45000",
    10,
  );
  const maxJobRuntimeMs = parseInt(
    process.env.REPORT_WORKER_MAX_JOB_RUNTIME_MS ?? "900000",
    10,
  );
  const watchdogIntervalMs = parseInt(
    process.env.REPORT_WORKER_WATCHDOG_INTERVAL_MS ?? "5000",
    10,
  );

  const requestShutdown = async (exitCode: number, reason: string): Promise<never> => {
    if (shutdownPromise) return shutdownPromise;

    markShutdownRequested(runtimeState);
    console.warn(`[report-worker][WARN][SHUTDOWN] stopping worker reason=${reason}`);

    shutdownPromise = (async () => {
      if (watchdogTimer) {
        clearInterval(watchdogTimer);
        watchdogTimer = null;
      }
      workerLoopControls?.stop();
      weeklyReviewSchedulerControls?.stop();
      await Promise.allSettled([
        artifactServer?.stop() ?? Promise.resolve(),
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
  const { startReportWorkerLoop, runSingleReportWorkerTick } = await import(
    "@webhealth/shared/lib/queue/report-worker"
  );
  const { startWeeklyReviewScheduler } = await import(
    "@webhealth/shared/lib/weekly-review-scheduler"
  );
  closeDb = sharedDbModule.closeDb;

  workerPhase = "database-ready";
  markWorkerPhase(runtimeState, "database-ready");
  await ensureWorkerDatabaseReady();
  markDatabaseReady(runtimeState);

  // Start artifact HTTP server for cross-service file downloads
  if (!once && process.env.ARTIFACT_TOKEN_SECRET) {
    workerPhase = "artifact-server";
    markWorkerPhase(runtimeState, "artifact-server");
    artifactServer = await startArtifactServer({
      getRuntimeState: () => runtimeState,
      staleAfterMs: readinessStaleAfterMs,
    });
    markArtifactServerListening(runtimeState);
  } else if (!once) {
    console.warn("[report-worker][WARN][BOOT] ARTIFACT_TOKEN_SECRET not set; artifact HTTP server disabled");
  }

  if (once) {
    workerPhase = "single-tick";
    markWorkerPhase(runtimeState, "single-tick");
    const result = await runSingleReportWorkerTick(undefined, {
      onFatalError: ({ error, nowMs }) => markFatalError(runtimeState, error, nowMs),
      onJobEnd: () => markJobEnd(runtimeState),
      onJobStart: ({ jobId, nowMs }) => markJobStart(runtimeState, { jobId, nowMs }),
      onLoopTick: ({ nowMs }) => markLoopTick(runtimeState, nowMs),
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
      onLoopTick: ({ nowMs }) => markLoopTick(runtimeState, nowMs),
    },
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
      console.error("[report-worker][FATAL][FATAL] stuck job watchdog triggered", error);
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
  console.error("[report-worker][FATAL][FATAL] worker process crashed", error);
  process.exit(1);
});

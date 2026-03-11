import { loadWorkerEnv } from "./load-env";
import { initWorkerMonitoring, reportWorkerFatalError } from "./monitoring";

loadWorkerEnv();
initWorkerMonitoring();

let workerPhase = "boot";

async function main() {
  workerPhase = "imports";
  const { ensureWorkerDatabaseReady } = await import("@webhealth/shared/db/worker-db-bootstrap");
  const { startReportWorkerLoop, runSingleReportWorkerTick } = await import(
    "@webhealth/shared/lib/queue/report-worker"
  );

  workerPhase = "database-ready";
  await ensureWorkerDatabaseReady();

  // Start artifact HTTP server for cross-service file downloads
  if (process.env.ARTIFACT_TOKEN_SECRET) {
    workerPhase = "artifact-server";
    const { startArtifactServer } = await import("./artifact-server");
    await startArtifactServer();
  } else {
    console.warn("[report-worker][WARN][BOOT] ARTIFACT_TOKEN_SECRET not set; artifact HTTP server disabled");
  }

  const once = process.argv.includes("--once");
  if (once) {
    workerPhase = "single-tick";
    const result = await runSingleReportWorkerTick();
    if (result.processed) {
      console.log(`[report-worker][INFO][WORKING] single tick processed job jobId=${result.jobId}`);
    } else {
      console.log("[report-worker][INFO][IDLE] single tick found no claimable jobs");
    }
    return;
  }

  workerPhase = "worker-loop";
  console.log("[report-worker][INFO][BOOT] starting worker process");
  startReportWorkerLoop();
}

main().catch(async (error) => {
  await reportWorkerFatalError(error, {
    phase: workerPhase,
    target: workerPhase === "database-ready" ? "direct-database" : "worker-process",
  });
  console.error("[report-worker][FATAL][FATAL] worker process crashed", error);
  process.exit(1);
});

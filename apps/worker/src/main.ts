import { loadWorkerEnv } from "./load-env";

loadWorkerEnv();

async function main() {
  const { ensureWorkerDatabaseReady } = await import("@webhealth/shared/db/worker-db-bootstrap");
  const { startReportWorkerLoop, runSingleReportWorkerTick } = await import(
    "@webhealth/shared/lib/queue/report-worker"
  );

  await ensureWorkerDatabaseReady();

  // Start artifact HTTP server for cross-service file downloads
  if (process.env.WORKER_API_SECRET) {
    const { startArtifactServer } = await import("./artifact-server");
    await startArtifactServer();
  } else {
    console.warn("[report-worker] WORKER_API_SECRET not set; artifact HTTP server disabled");
  }

  const once = process.argv.includes("--once");
  if (once) {
    const result = await runSingleReportWorkerTick();
    console.log("[report-worker] tick result:", result);
    return;
  }

  console.log("[report-worker] starting loop...");
  startReportWorkerLoop();
}

main().catch((error) => {
  console.error("[report-worker] fatal error", error);
  process.exit(1);
});

import { startReportWorkerLoop, runSingleReportWorkerTick } from "@webhealth/shared/lib/queue/report-worker";
import { loadWorkerEnv } from "./load-env";

loadWorkerEnv();

async function main() {
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

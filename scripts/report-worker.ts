import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { runSingleReportWorkerTick, startReportWorkerLoop } = await import("@webhealth/shared/lib/queue/report-worker");
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

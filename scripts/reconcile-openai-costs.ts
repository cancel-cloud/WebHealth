import { config } from "dotenv";

config({ path: ".env.local" });
config();

function unixDaysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

async function main() {
  const { reconcileOpenAIDailyCosts } = await import("../src/lib/openai/cost-reconciler");
  const days = parseInt(process.argv[2] ?? "7", 10);
  const startTime = unixDaysAgo(days);
  const rows = await reconcileOpenAIDailyCosts({ startTime });
  console.log(`[openai:reconcile-costs] upserted ${rows.length} rows`);
}

main().catch((error) => {
  console.error("[openai:reconcile-costs] fatal", error);
  process.exit(1);
});

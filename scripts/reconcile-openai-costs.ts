import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const daysArg = Number(process.argv[2] ?? "7");
  const days = Number.isFinite(daysArg) && daysArg > 0 ? Math.floor(daysArg) : 7;
  const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { reconcileOpenAIDailyCosts } = await import("@webhealth/shared/lib/openai/cost-reconciler");

  const rows = await reconcileOpenAIDailyCosts({ startTime });
  console.log(`[openai:reconcile-costs] upserted ${rows.length} rows`);
}

main().catch((error) => {
  console.error("[openai:reconcile-costs] fatal", error);
  process.exit(1);
});

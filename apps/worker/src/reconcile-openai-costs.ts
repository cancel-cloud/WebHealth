import { loadWorkerEnv } from "./load-env";
import { runOpenAICostReconciliation } from "./openai-cost-reconciliation";

loadWorkerEnv();

async function main() {
  const result = await runOpenAICostReconciliation();
  console.log(
    `[openai-costs][INFO] reconciled rows=${result.rows} buckets=${result.buckets} start=${result.startDate} end=${result.endDate}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });

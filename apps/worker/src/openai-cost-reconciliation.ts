import { reconcileOpenAIDailyCosts } from "@webhealth/shared/lib/openai/cost-reconciler";
import { backfillOpenAICostLedgerFromCompletedRuns } from "@webhealth/shared/lib/openai/cost-ledger";

const DEFAULT_RECONCILIATION_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function requireOpenAIAdminKey(env: Record<string, string | undefined>) {
  const key = env.OPENAI_ADMIN_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_COST_RECONCILIATION_CONFIG_ERROR: OPENAI_ADMIN_KEY is required.");
  }
  return key;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getOpenAICostReconciliationSchedulerConfig(input: {
  once: boolean;
  env?: Record<string, string | undefined>;
}) {
  const env = input.env ?? process.env;
  if (input.once) return { enabled: false as const, reason: "once-mode" as const };
  if (!env.OPENAI_ADMIN_KEY?.trim()) return { enabled: false as const, reason: "missing-admin-key" as const };
  return {
    enabled: true as const,
    intervalMs: parsePositiveInt(
      env.OPENAI_COST_RECONCILIATION_INTERVAL_MS,
      DEFAULT_RECONCILIATION_INTERVAL_MS,
    ),
  };
}

export async function runOpenAICostReconciliation(input: {
  env?: Record<string, string | undefined>;
  now?: Date;
  fetchFn?: typeof fetch;
} = {}) {
  const env = input.env ?? process.env;
  const adminKey = requireOpenAIAdminKey(env);
  await backfillOpenAICostLedgerFromCompletedRuns();
  return reconcileOpenAIDailyCosts({
    adminKey,
    baseUrl: env.OPENAI_BASE_URL,
    days: parsePositiveInt(env.OPENAI_COST_RECONCILIATION_DAYS, 90),
    now: input.now,
    fetchFn: input.fetchFn,
  });
}

export function startOpenAICostReconciliationScheduler(input: {
  once: boolean;
  env?: Record<string, string | undefined>;
}): { stop: () => void } | null {
  const config = getOpenAICostReconciliationSchedulerConfig(input);
  if (!config.enabled) {
    console.log(`[openai-costs][INFO] scheduler disabled reason=${config.reason}`);
    return null;
  }

  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runOpenAICostReconciliation({ env: input.env });
      console.log(`[openai-costs][INFO] reconciled rows=${result.rows} buckets=${result.buckets}`);
    } catch (error) {
      console.error("[openai-costs][ERROR] reconciliation failed", error);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(() => void run(), config.intervalMs);
  return {
    stop: () => clearInterval(timer),
  };
}

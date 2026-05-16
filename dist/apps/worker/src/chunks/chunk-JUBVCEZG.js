import {
  openaiCostLedger
} from "./chunk-W7P3RKIV.js";

// packages/shared/src/lib/openai/cost-ledger.ts
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// packages/shared/src/lib/openai/cost-estimator.ts
var MODEL_PRICING = {
  "gpt-5.5": { inputPer1M: 5, outputPer1M: 30, cachedInputPer1M: 0.5 },
  "gpt-5.4-mini": { inputPer1M: 0.75, outputPer1M: 4.5, cachedInputPer1M: 0.08 },
  "gpt-5.4-nano": { inputPer1M: 0.2, outputPer1M: 1.25, cachedInputPer1M: 0.02 },
  "gpt-5.4": { inputPer1M: 2.5, outputPer1M: 15, cachedInputPer1M: 0.25 },
  "gpt-5.2": { inputPer1M: 1.75, outputPer1M: 14, cachedInputPer1M: 0.175 },
  "gpt-5-mini": { inputPer1M: 0.25, outputPer1M: 2 },
  "gpt-5": { inputPer1M: 1.75, outputPer1M: 14, cachedInputPer1M: 0.175 },
  "gpt-5.3": { inputPer1M: 1.75, outputPer1M: 14, cachedInputPer1M: 0.175 }
};
function getPricing(model) {
  if (!model) return null;
  const normalized = model.toLowerCase();
  for (const [prefix, pricing] of Object.entries(MODEL_PRICING)) {
    if (normalized.startsWith(prefix)) return pricing;
  }
  return null;
}
function estimateOpenAICostUsd(model, usage) {
  if (!usage) return null;
  const pricing = getPricing(model);
  if (!pricing) return null;
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const cachedInputTokens = usage.cachedInputTokens ?? 0;
  const nonCachedInputTokens = Math.max(0, inputTokens - cachedInputTokens);
  const inputCost = nonCachedInputTokens / 1e6 * pricing.inputPer1M;
  const cachedCost = pricing.cachedInputPer1M != null ? cachedInputTokens / 1e6 * pricing.cachedInputPer1M : cachedInputTokens / 1e6 * pricing.inputPer1M;
  const outputCost = outputTokens / 1e6 * pricing.outputPer1M;
  return Number((inputCost + cachedCost + outputCost).toFixed(6));
}
function normalizeOpenAIUsage(raw) {
  if (!raw || typeof raw !== "object") return null;
  const usage = raw;
  const inputTokens = typeof usage.input_tokens === "number" ? usage.input_tokens : void 0;
  const outputTokens = typeof usage.output_tokens === "number" ? usage.output_tokens : void 0;
  const totalTokens = typeof usage.total_tokens === "number" ? usage.total_tokens : void 0;
  const inputDetails = usage.input_tokens_details && typeof usage.input_tokens_details === "object" ? usage.input_tokens_details : void 0;
  const outputDetails = usage.output_tokens_details && typeof usage.output_tokens_details === "object" ? usage.output_tokens_details : void 0;
  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cachedInputTokens: typeof inputDetails?.cached_tokens === "number" ? inputDetails.cached_tokens : void 0,
    reasoningTokens: typeof outputDetails?.reasoning_tokens === "number" ? outputDetails.reasoning_tokens : void 0,
    raw: usage
  };
}

// packages/shared/src/lib/openai/cost-ledger.ts
function numeric(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function sanitizeUsageSnapshot(usage) {
  return {
    inputTokens: numeric(usage?.inputTokens),
    outputTokens: numeric(usage?.outputTokens),
    totalTokens: numeric(usage?.totalTokens),
    cachedInputTokens: numeric(usage?.cachedInputTokens),
    reasoningTokens: numeric(usage?.reasoningTokens)
  };
}
function parseUsd(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
function buildOpenAICostLedgerInsert(input) {
  const usageSnapshot = sanitizeUsageSnapshot(input.usage);
  const costEstimateUsd = estimateOpenAICostUsd(input.model, usageSnapshot) ?? 0;
  return {
    id: input.id ?? `oaic_${nanoid(12)}`,
    aiRunId: input.aiRunId,
    teamId: input.teamId,
    propertyId: input.propertyId,
    refreshJobId: input.refreshJobId ?? null,
    callPurpose: input.callPurpose,
    model: input.model,
    requestId: input.requestId ?? null,
    outcome: input.outcome ?? "succeeded",
    inputTokens: usageSnapshot.inputTokens ?? 0,
    outputTokens: usageSnapshot.outputTokens ?? 0,
    totalTokens: usageSnapshot.totalTokens ?? 0,
    cachedInputTokens: usageSnapshot.cachedInputTokens ?? 0,
    reasoningTokens: usageSnapshot.reasoningTokens ?? 0,
    usageSnapshot,
    costEstimateUsd: costEstimateUsd.toFixed(6),
    updatedAt: /* @__PURE__ */ new Date()
  };
}
function summarizeOpenAICostLedgerRows(rows) {
  let successfulEstimateUsd = 0;
  let failedEstimateUsd = 0;
  const usageSnapshot = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    cachedInputTokens: 0,
    reasoningTokens: 0
  };
  for (const row of rows) {
    const estimate = parseUsd(row.costEstimateUsd);
    if (row.outcome === "succeeded") successfulEstimateUsd += estimate;
    else failedEstimateUsd += estimate;
    usageSnapshot.inputTokens += numeric(row.usageSnapshot?.inputTokens);
    usageSnapshot.outputTokens += numeric(row.usageSnapshot?.outputTokens);
    usageSnapshot.totalTokens += numeric(row.usageSnapshot?.totalTokens);
    usageSnapshot.cachedInputTokens += numeric(row.usageSnapshot?.cachedInputTokens);
    usageSnapshot.reasoningTokens += numeric(row.usageSnapshot?.reasoningTokens);
  }
  return {
    successfulEstimateUsd: Number(successfulEstimateUsd.toFixed(6)),
    failedEstimateUsd: Number(failedEstimateUsd.toFixed(6)),
    totalEstimateUsd: Number((successfulEstimateUsd + failedEstimateUsd).toFixed(6)),
    usageSnapshot
  };
}
async function recordOpenAICostLedgerEntry(input) {
  const { db } = await import("./db-J7MSJUF6.js");
  const [row] = await db.insert(openaiCostLedger).values(buildOpenAICostLedgerInsert(input)).returning();
  return row;
}
async function markOpenAICostLedgerRunOutcome(aiRunId, outcome) {
  const { db } = await import("./db-J7MSJUF6.js");
  await db.update(openaiCostLedger).set({ outcome, updatedAt: /* @__PURE__ */ new Date() }).where(eq(openaiCostLedger.aiRunId, aiRunId));
}
async function clearOpenAICostLedgerForRun(aiRunId) {
  const { db } = await import("./db-J7MSJUF6.js");
  await db.delete(openaiCostLedger).where(eq(openaiCostLedger.aiRunId, aiRunId));
}
async function getOpenAICostLedgerRunSummary(aiRunId) {
  const { db } = await import("./db-J7MSJUF6.js");
  const rows = await db.select({
    outcome: openaiCostLedger.outcome,
    costEstimateUsd: openaiCostLedger.costEstimateUsd,
    usageSnapshot: openaiCostLedger.usageSnapshot
  }).from(openaiCostLedger).where(eq(openaiCostLedger.aiRunId, aiRunId));
  return summarizeOpenAICostLedgerRows(rows.map((row) => ({
    outcome: row.outcome,
    costEstimateUsd: row.costEstimateUsd,
    usageSnapshot: row.usageSnapshot
  })));
}
async function backfillOpenAICostLedgerFromCompletedRuns() {
  const { db } = await import("./db-J7MSJUF6.js");
  await db.execute(sql`
    insert into openai_cost_ledger (
      id,
      ai_run_id,
      team_id,
      property_id,
      refresh_job_id,
      call_purpose,
      model,
      outcome,
      input_tokens,
      output_tokens,
      total_tokens,
      cached_input_tokens,
      reasoning_tokens,
      usage_snapshot,
      cost_estimate_usd,
      created_at,
      updated_at
    )
    select
      'oaic_backfill_' || r.id,
      r.id,
      r.team_id,
      r.property_id,
      r.refresh_job_id,
      'historical_ai_run',
      coalesce(r.analyzer_model, r.summary_model, 'unknown'),
      'succeeded',
      coalesce((r.usage_snapshot->>'inputTokens')::int, 0),
      coalesce((r.usage_snapshot->>'outputTokens')::int, 0),
      coalesce((r.usage_snapshot->>'totalTokens')::int, 0),
      coalesce((r.usage_snapshot->>'cachedInputTokens')::int, 0),
      coalesce((r.usage_snapshot->>'reasoningTokens')::int, 0),
      coalesce(r.usage_snapshot, '{}'::jsonb),
      r.cost_estimate_usd,
      coalesce(r.finished_at, r.updated_at, r.created_at),
      now()
    from ai_analysis_runs r
    where r.status = 'complete'
      and r.cost_estimate_usd is not null
      and not exists (
        select 1
        from openai_cost_ledger l
        where l.ai_run_id = r.id
      )
  `);
}

export {
  normalizeOpenAIUsage,
  recordOpenAICostLedgerEntry,
  markOpenAICostLedgerRunOutcome,
  clearOpenAICostLedgerForRun,
  getOpenAICostLedgerRunSummary,
  backfillOpenAICostLedgerFromCompletedRuns
};

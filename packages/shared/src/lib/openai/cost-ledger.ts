import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { openaiCostLedger } from "@webhealth/shared/db/schema";
import type { AiUsageSnapshot } from "@webhealth/shared/lib/action-types";
import { estimateOpenAICostUsd } from "./cost-estimator";

export type OpenAICostLedgerOutcome = "succeeded" | "failed" | "partial";

export type OpenAICostLedgerRowForSummary = {
  outcome: string;
  costEstimateUsd: string | number | null;
  usageSnapshot: Partial<AiUsageSnapshot> | null;
};

export type BuildOpenAICostLedgerInsertInput = {
  id?: string;
  aiRunId: string;
  teamId: string;
  propertyId: string;
  refreshJobId?: string | null;
  callPurpose: string;
  model: string;
  usage: AiUsageSnapshot | null | undefined;
  requestId?: string | null;
  outcome?: OpenAICostLedgerOutcome;
};

function numeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sanitizeUsageSnapshot(usage: AiUsageSnapshot | null | undefined): AiUsageSnapshot {
  return {
    inputTokens: numeric(usage?.inputTokens),
    outputTokens: numeric(usage?.outputTokens),
    totalTokens: numeric(usage?.totalTokens),
    cachedInputTokens: numeric(usage?.cachedInputTokens),
    reasoningTokens: numeric(usage?.reasoningTokens),
  };
}

function parseUsd(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildOpenAICostLedgerInsert(input: BuildOpenAICostLedgerInsertInput) {
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
    updatedAt: new Date(),
  };
}

export function summarizeOpenAICostLedgerRows(rows: OpenAICostLedgerRowForSummary[]) {
  let successfulEstimateUsd = 0;
  let failedEstimateUsd = 0;
  const usageSnapshot: Required<Omit<AiUsageSnapshot, "raw">> = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    cachedInputTokens: 0,
    reasoningTokens: 0,
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
    usageSnapshot,
  };
}

export async function recordOpenAICostLedgerEntry(input: BuildOpenAICostLedgerInsertInput) {
  const { db } = await import("@webhealth/shared/db");
  const [row] = await db
    .insert(openaiCostLedger)
    .values(buildOpenAICostLedgerInsert(input))
    .returning();
  return row;
}

export async function markOpenAICostLedgerRunOutcome(
  aiRunId: string,
  outcome: OpenAICostLedgerOutcome,
) {
  const { db } = await import("@webhealth/shared/db");
  await db
    .update(openaiCostLedger)
    .set({ outcome, updatedAt: new Date() })
    .where(eq(openaiCostLedger.aiRunId, aiRunId));
}

export async function clearOpenAICostLedgerForRun(aiRunId: string) {
  const { db } = await import("@webhealth/shared/db");
  await db.delete(openaiCostLedger).where(eq(openaiCostLedger.aiRunId, aiRunId));
}

export async function getOpenAICostLedgerRunSummary(aiRunId: string) {
  const { db } = await import("@webhealth/shared/db");
  const rows = await db
    .select({
      outcome: openaiCostLedger.outcome,
      costEstimateUsd: openaiCostLedger.costEstimateUsd,
      usageSnapshot: openaiCostLedger.usageSnapshot,
    })
    .from(openaiCostLedger)
    .where(eq(openaiCostLedger.aiRunId, aiRunId));

  return summarizeOpenAICostLedgerRows(rows.map((row) => ({
    outcome: row.outcome,
    costEstimateUsd: row.costEstimateUsd,
    usageSnapshot: row.usageSnapshot as Partial<AiUsageSnapshot> | null,
  })));
}

export async function backfillOpenAICostLedgerFromCompletedRuns() {
  const { db } = await import("@webhealth/shared/db");
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

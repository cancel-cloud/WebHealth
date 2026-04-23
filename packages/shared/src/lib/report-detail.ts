import type {
  AiSeoReport,
  AiUsageSnapshot,
  RecommendationDetail,
} from "@webhealth/shared/lib/reports/types";
import { normalizeOpenAIUsage } from "@webhealth/shared/lib/openai/cost-estimator";
import { sanitizeActionDetailPayload } from "@webhealth/shared/lib/action-detail";

export type RowType =
  | "weeklyAction"
  | "actionBacklog"
  | "ctrGap"
  | "nearWin"
  | "cannibalization"
  | "contentDecay";

export const rowTypeToArrayKey: Record<RowType, keyof AiSeoReport> = {
  weeklyAction: "weeklyActionRows",
  actionBacklog: "actionBacklogRows",
  ctrGap: "lostClickEstimateRows",
  nearWin: "nearWinKeywordRows",
  cannibalization: "cannibalizationRows",
  contentDecay: "contentDecayRows",
};

const rowTypeToIdField: Record<RowType, string> = {
  weeklyAction: "id",
  actionBacklog: "id",
  ctrGap: "query",
  nearWin: "keyword",
  cannibalization: "query",
  contentDecay: "page",
};

export function isRowType(value: string): value is RowType {
  return value in rowTypeToArrayKey;
}

export function findRow(
  aiReport: AiSeoReport,
  rowType: RowType,
  rowId: string
): Record<string, unknown> | null {
  const arrayKey = rowTypeToArrayKey[rowType];
  const idField = rowTypeToIdField[rowType];
  const rows = aiReport[arrayKey] as Record<string, unknown>[] | null | undefined;
  if (!rows) return null;
  return rows.find((r) => r[idField] === rowId) ?? null;
}

export function patchRowActionDetail(
  aiReport: AiSeoReport,
  rowType: RowType,
  rowId: string,
  actionDetail: RecommendationDetail
): AiSeoReport {
  const arrayKey = rowTypeToArrayKey[rowType];
  const idField = rowTypeToIdField[rowType];
  const rows = aiReport[arrayKey] as Record<string, unknown>[] | null | undefined;
  if (!rows) return aiReport;

  const patched = rows.map((r) =>
    r[idField] === rowId ? { ...r, actionDetail } : r
  );

  return { ...aiReport, [arrayKey]: patched };
}

export function computeNextDetailsCostUsd(
  existingCostUsd: string | number | null | undefined,
  callCostUsd: number | null | undefined
): string | null {
  const parsedExisting = Number(existingCostUsd ?? 0);
  const previousCost = Number.isFinite(parsedExisting) ? parsedExisting : 0;

  if (callCostUsd == null || !Number.isFinite(callCostUsd)) {
    return previousCost > 0 ? String(previousCost) : null;
  }

  return (previousCost + callCostUsd).toFixed(6);
}

export function shouldGenerateDetail(rowData: Record<string, unknown>) {
  const actionDetail = rowData.actionDetail;
  return !(actionDetail && typeof actionDetail === "object");
}

export function makeDetailClientRequestId(input: {
  reportId: string;
  requestNumber: number;
  kind: RowType;
}) {
  const sanitizedKind = input.kind.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `report_${input.reportId}_detail_${input.requestNumber}_${sanitizedKind}`;
}

export function normalizeDetailUsage(rawUsage: unknown): AiUsageSnapshot | null {
  const normalized = normalizeOpenAIUsage(rawUsage);
  if (!rawUsage || typeof rawUsage !== "object") return normalized;
  const usage = rawUsage as Record<string, unknown>;
  const promptTokens = typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined;
  const completionTokens =
    typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined;
  const totalTokens = typeof usage.total_tokens === "number" ? usage.total_tokens : undefined;
  const cachedInputTokens =
    usage.prompt_tokens_details &&
    typeof usage.prompt_tokens_details === "object" &&
    typeof (usage.prompt_tokens_details as Record<string, unknown>).cached_tokens === "number"
      ? ((usage.prompt_tokens_details as Record<string, unknown>).cached_tokens as number)
      : undefined;

  return {
    inputTokens: normalized?.inputTokens ?? promptTokens,
    outputTokens: normalized?.outputTokens ?? completionTokens,
    totalTokens: normalized?.totalTokens ?? totalTokens,
    cachedInputTokens: normalized?.cachedInputTokens ?? cachedInputTokens,
    reasoningTokens: normalized?.reasoningTokens,
    raw: normalized?.raw ?? usage,
  };
}

export const detailSchema = {
  type: "object",
  properties: {
    observed: { type: "array", items: { type: "string" } },
    likelyCauses: { type: "array", items: { type: "string" } },
    recommendedActions: { type: "array", items: { type: "string" } },
    whyThisHelps: { type: "array", items: { type: "string" } },
    expectedOutcome: { type: "array", items: { type: "string" } },
    evidence: {
      type: "object",
      properties: {
        deterministic: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              value: { type: "string" },
            },
            required: ["label", "value"],
            additionalProperties: false,
          },
        },
        inferred: { type: "array", items: { type: "string" } },
      },
      required: ["deterministic", "inferred"],
      additionalProperties: false,
    },
  },
  required: [
    "observed",
    "likelyCauses",
    "recommendedActions",
    "whyThisHelps",
    "expectedOutcome",
    "evidence",
  ],
  additionalProperties: false,
};

export function buildActionDetailPrompt(input: {
  siteUrl: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  rowType: RowType;
  rowData: Record<string, unknown>;
}) {
  return `You are an SEO expert generating a personalized action detail for a specific issue found on ${input.siteUrl}.

The report covers ${input.dateRangeStart} to ${input.dateRangeEnd}.

Issue type: ${input.rowType}
Issue data: ${JSON.stringify(input.rowData, null, 2)}

Rules:
- Use only facts that can be grounded in the issue data. Do not fabricate URLs, query counts, or competitor claims.
- Keep the output decision-oriented for a non-expert operator.
- observed: 2-4 factual bullets grounded in the actual numbers or URLs.
- likelyCauses: 1-3 inferred explanations. Only include plausible causes supported by the issue data.
- recommendedActions: 2-4 executable tasks. Be specific, but do not invent section names or exact counts unless present in the issue data.
- whyThisHelps: 1-3 bullets explaining the mechanism of action.
- expectedOutcome: 2-3 bullets describing the likely result and earliest believable signal.
- evidence.deterministic: label/value facts only, each grounded in the issue data.
- evidence.inferred: 1-3 short inferred bullets.`;
}

export function serializeActionDetail(raw: unknown) {
  return sanitizeActionDetailPayload(raw);
}

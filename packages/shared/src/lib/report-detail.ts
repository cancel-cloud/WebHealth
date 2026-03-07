import type { AiSeoReport, AiUsageSnapshot } from "@webhealth/shared/lib/reports/types";
import { normalizeOpenAIUsage } from "@webhealth/shared/lib/openai/cost-estimator";
import { sanitizeActionDetailPayload } from "@webhealth/shared/lib/action-detail";

export type RowType =
  | "actionBacklog"
  | "ctrGap"
  | "nearWin"
  | "cannibalization"
  | "contentDecay";

export const rowTypeToArrayKey: Record<RowType, keyof AiSeoReport> = {
  actionBacklog: "actionBacklogRows",
  ctrGap: "lostClickEstimateRows",
  nearWin: "nearWinKeywordRows",
  cannibalization: "cannibalizationRows",
  contentDecay: "contentDecayRows",
};

const rowTypeToIdField: Record<RowType, string> = {
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
  actionDetail: string
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
  return !(typeof rowData.actionDetail === "string" && rowData.actionDetail.length > 0);
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
    affectedUrls: { type: "array", items: { type: "string" } },
    fixSteps: { type: "array", items: { type: "string" } },
    whyItMatters: { type: "string" },
  },
  required: ["affectedUrls", "fixSteps", "whyItMatters"],
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
- Use actual URLs from the issue data. Do not fabricate URLs.
- Write fix steps for a non-technical site owner. Be concrete, not generic.
- Do not give generic SEO advice. Every sentence must reference this specific site or issue.
- affectedUrls: list only URLs present in the issue data (pages, targetLandingPage, etc.)
- fixSteps: 3–5 numbered steps, imperative voice, ≤30 words each
- whyItMatters: 1–2 sentences referencing the actual metric values in the issue data`;
}

function normalizeActionDetailInput(raw: unknown) {
  if (typeof raw !== "string") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid action detail JSON");
  }
}

export function serializeActionDetail(raw: unknown) {
  return JSON.stringify(sanitizeActionDetailPayload(normalizeActionDetailInput(raw)));
}

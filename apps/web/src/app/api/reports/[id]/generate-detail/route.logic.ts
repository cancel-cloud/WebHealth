import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";

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

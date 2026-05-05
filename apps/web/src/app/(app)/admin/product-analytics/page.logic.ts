export type DailyActualCostRow = {
  sourceDate: string;
  totalUsd: string | null;
};

export type JobThroughputRow = {
  family: "source_data" | "property_refresh" | "snapshot";
  status: string;
  count: number;
};

function parseUsd(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDate(value: string | Date) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function buildActualSpendSummary(rows: DailyActualCostRow[]) {
  const total = rows.reduce((sum, row) => sum + parseUsd(row.totalUsd), 0);
  return total.toFixed(6);
}

export function buildActualSpendSeries(rows: DailyActualCostRow[]) {
  return rows
    .map((row) => ({
      date: normalizeDate(row.sourceDate),
      totalUsd: parseUsd(row.totalUsd),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const FAMILY_LABELS: Record<JobThroughputRow["family"], string> = {
  source_data: "Source data",
  property_refresh: "Property refresh",
  snapshot: "Snapshots",
};

export function buildJobThroughputSeries(rows: JobThroughputRow[]) {
  const byFamily = new Map<string, {
    family: string;
    queued: number;
    processing: number;
    complete: number;
    failed: number;
    partial: number;
  }>();

  for (const row of rows) {
    const family = FAMILY_LABELS[row.family];
    const existing = byFamily.get(family) ?? {
      family,
      queued: 0,
      processing: 0,
      complete: 0,
      failed: 0,
      partial: 0,
    };
    if (row.status === "queued") existing.queued += Number(row.count ?? 0);
    if (row.status === "processing") existing.processing += Number(row.count ?? 0);
    if (row.status === "complete" || row.status === "success") existing.complete += Number(row.count ?? 0);
    if (row.status === "failed") existing.failed += Number(row.count ?? 0);
    if (row.status === "partial") existing.partial += Number(row.count ?? 0);
    byFamily.set(family, existing);
  }

  return [...byFamily.values()];
}

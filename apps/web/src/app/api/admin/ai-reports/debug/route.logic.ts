type DateLike = Date | string | null;

export type DebugJobFamily = "source_data" | "property_refresh";

export type DebugJobStatus = "queued" | "processing" | "complete" | "failed" | "partial";

export type DebugJobActivityItem = {
  id: string;
  family: DebugJobFamily;
  label: string;
  teamId: string;
  propertyId: string | null;
  kind: string;
  status: DebugJobStatus;
  phase: string;
  attempts: number | null;
  maxAttempts: number | null;
  claimedBy: string | null;
  heartbeatAt: string | null;
  claimExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
  usage: Record<string, unknown> | null;
};

export type DebugActivityCounts = Record<
  "sourceData" | "propertyRefresh",
  {
    queued: number;
    active: number;
    complete: number;
    failed: number;
    partial: number;
    total: number;
  }
>;

export type DebugMetricsJobRow = {
  id: string;
  teamId: string;
  targetPropertyId: string | null;
  includeGsc: boolean;
  includeGa4: boolean;
  reason: string;
  status: string;
  triggerSource: string;
  totals: unknown;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  claimedBy: string | null;
  claimExpiresAt: DateLike;
  heartbeatAt: DateLike;
  createdAt: DateLike;
  startedAt: DateLike;
  finishedAt: DateLike;
};

export type DebugPropertyRefreshJobRow = {
  id: string;
  teamId: string;
  propertyId: string;
  jobType: string;
  status: string;
  phase: string;
  message: string | null;
  progressMeta: unknown;
  lastError: string | null;
  attempts: number;
  maxAttempts: number;
  claimedBy: string | null;
  claimExpiresAt: DateLike;
  heartbeatAt: DateLike;
  createdAt: DateLike;
  updatedAt: DateLike;
  startedAt: DateLike;
  finishedAt: DateLike;
};

function toIso(value: DateLike): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toRequiredIso(value: DateLike): string {
  return toIso(value) ?? new Date(0).toISOString();
}

function normalizeStatus(status: string): DebugJobStatus {
  if (status === "queued" || status === "processing" || status === "complete" || status === "failed" || status === "partial") {
    return status;
  }
  if (status === "success") return "complete";
  return "failed";
}

function isActiveStatus(status: DebugJobStatus) {
  return status === "queued" || status === "processing";
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function makeEmptyCounts(): DebugActivityCounts {
  const row = () => ({ queued: 0, active: 0, complete: 0, failed: 0, partial: 0, total: 0 });
  return {
    sourceData: row(),
    propertyRefresh: row(),
  };
}

function incrementCount(counts: DebugActivityCounts, family: DebugJobFamily, status: DebugJobStatus) {
  const key = family === "source_data" ? "sourceData" : "propertyRefresh";
  counts[key].total += 1;
  if (status === "queued") counts[key].queued += 1;
  if (isActiveStatus(status)) counts[key].active += 1;
  if (status === "complete") counts[key].complete += 1;
  if (status === "failed") counts[key].failed += 1;
  if (status === "partial") counts[key].partial += 1;
}

export function buildUnifiedJobActivity(input: {
  metricsJobs: DebugMetricsJobRow[];
  propertyRefreshJobs: DebugPropertyRefreshJobRow[];
  limit?: number;
}) {
  const items: DebugJobActivityItem[] = [
    ...input.metricsJobs.map((job) => ({
      id: job.id,
      family: "source_data" as const,
      label: job.includeGsc && job.includeGa4 ? "GSC + GA4 source refresh" : job.includeGsc ? "GSC source refresh" : "GA4 source refresh",
      teamId: job.teamId,
      propertyId: job.targetPropertyId,
      kind: job.reason,
      status: normalizeStatus(job.status),
      phase: job.status === "queued" ? "source_data_queued" : job.status === "processing" ? "source_data" : "done",
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      claimedBy: job.claimedBy,
      heartbeatAt: toIso(job.heartbeatAt),
      claimExpiresAt: toIso(job.claimExpiresAt),
      createdAt: toRequiredIso(job.createdAt),
      updatedAt: toRequiredIso(job.finishedAt ?? job.heartbeatAt ?? job.startedAt ?? job.createdAt),
      lastError: job.error,
      usage: readRecord(job.totals),
    })),
    ...input.propertyRefreshJobs.map((job) => ({
      id: job.id,
      family: "property_refresh" as const,
      label: job.jobType === "crawl_refresh" ? "Technical crawl refresh" : "Decision refresh",
      teamId: job.teamId,
      propertyId: job.propertyId,
      kind: job.jobType,
      status: normalizeStatus(job.status),
      phase: job.phase,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      claimedBy: job.claimedBy,
      heartbeatAt: toIso(job.heartbeatAt),
      claimExpiresAt: toIso(job.claimExpiresAt),
      createdAt: toRequiredIso(job.createdAt),
      updatedAt: toRequiredIso(job.updatedAt ?? job.finishedAt ?? job.startedAt ?? job.createdAt),
      lastError: job.lastError,
      usage: readRecord(job.progressMeta),
    })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const counts = makeEmptyCounts();
  for (const item of items) {
    incrementCount(counts, item.family, item.status);
  }

  return {
    items: items.slice(0, input.limit ?? 100),
    counts,
  };
}

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import {
  propertyCrawlSnapshots,
  propertyRefreshJobs,
  reports,
} from "@webhealth/shared/db/schema";
import type { CrawlResult } from "@webhealth/shared/lib/crawl";

export type PropertyRefreshJobType = "crawl_refresh" | "decision_refresh";
export type PropertyRefreshJobStatus = "queued" | "processing" | "complete" | "failed" | "partial";

export type PropertyRefreshState = {
  id: string;
  jobType: PropertyRefreshJobType;
  status: PropertyRefreshJobStatus;
  phase: string;
  message: string | null;
  progressMeta: Record<string, unknown> | null;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
};

type PropertyRefreshPayload = {
  preset?: string | null;
  compareMode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

function normalizePropertyRefreshRow(row: typeof propertyRefreshJobs.$inferSelect): PropertyRefreshState {
  return {
    id: row.id,
    jobType: row.jobType as PropertyRefreshJobType,
    status: row.status as PropertyRefreshJobStatus,
    phase: row.phase,
    message: row.message ?? null,
    progressMeta: (row.progressMeta as Record<string, unknown> | null) ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function readStoredCrawlData(value: unknown): CrawlResult | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const crawl = data.crawl;
  if (!crawl || typeof crawl !== "object") return null;
  const parsed = crawl as CrawlResult;
  if (!Array.isArray(parsed.pages) || !parsed.summary || typeof parsed.summary !== "object") {
    return null;
  }
  return parsed;
}

export async function enqueuePropertyRefreshJob(input: {
  teamId: string;
  propertyId: string;
  triggeredByUserId?: string | null;
  jobType: PropertyRefreshJobType;
  payload?: PropertyRefreshPayload;
}) {
  const supersededAt = new Date();
  await db
    .update(propertyRefreshJobs)
    .set({
      supersededAt,
      updatedAt: supersededAt,
    })
    .where(
      and(
        eq(propertyRefreshJobs.teamId, input.teamId),
        eq(propertyRefreshJobs.propertyId, input.propertyId),
        eq(propertyRefreshJobs.jobType, input.jobType),
        isNull(propertyRefreshJobs.supersededAt),
        inArray(propertyRefreshJobs.status, ["queued", "processing"]),
      ),
    );

  const [job] = await db
    .insert(propertyRefreshJobs)
    .values({
      id: `prj_${nanoid(12)}`,
      teamId: input.teamId,
      propertyId: input.propertyId,
      triggeredByUserId: input.triggeredByUserId ?? null,
      jobType: input.jobType,
      status: "queued",
      phase: "queued",
      message: input.jobType === "crawl_refresh" ? "Technical refresh queued" : "Decision refresh queued",
      payload: input.payload ?? null,
      updatedAt: new Date(),
    })
    .returning();

  return normalizePropertyRefreshRow(job);
}

export type ClaimedPropertyRefreshJob = typeof propertyRefreshJobs.$inferSelect;

function normalizeClaimedPropertyRefreshJobRow(
  row: Record<string, unknown> | null | undefined,
): ClaimedPropertyRefreshJob | null {
  if (!row) return null;

  const readDate = (value: unknown) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const readString = (value: unknown) =>
    typeof value === "string" ? value : null;

  return {
    id: String(row.id ?? ""),
    teamId: String(row.team_id ?? row.teamId ?? ""),
    propertyId: String(row.property_id ?? row.propertyId ?? ""),
    triggeredByUserId: readString(row.triggered_by_user_id ?? row.triggeredByUserId),
    jobType: String(row.job_type ?? row.jobType ?? ""),
    status: String(row.status ?? ""),
    phase: String(row.phase ?? ""),
    message: typeof row.message === "string" ? row.message : null,
    progressMeta: (row.progress_meta ?? row.progressMeta ?? null) as Record<string, unknown> | null,
    payload: (row.payload ?? null) as Record<string, unknown> | null,
    lastError: typeof (row.last_error ?? row.lastError) === "string"
      ? String(row.last_error ?? row.lastError)
      : null,
    availableAt: readDate(row.available_at ?? row.availableAt) ?? new Date(),
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? row.maxAttempts ?? 0),
    claimedBy: typeof (row.claimed_by ?? row.claimedBy) === "string"
      ? String(row.claimed_by ?? row.claimedBy)
      : null,
    claimedAt: readDate(row.claimed_at ?? row.claimedAt),
    claimExpiresAt: readDate(row.claim_expires_at ?? row.claimExpiresAt),
    heartbeatAt: readDate(row.heartbeat_at ?? row.heartbeatAt),
    startedAt: readDate(row.started_at ?? row.startedAt),
    finishedAt: readDate(row.finished_at ?? row.finishedAt),
    supersededAt: readDate(row.superseded_at ?? row.supersededAt),
    createdAt: readDate(row.created_at ?? row.createdAt) ?? new Date(),
    updatedAt: readDate(row.updated_at ?? row.updatedAt) ?? new Date(),
  };
}

export async function claimNextPropertyRefreshJob(workerId: string): Promise<ClaimedPropertyRefreshJob | null> {
  const leaseSeconds = parseInt(process.env.PROPERTY_REFRESH_WORKER_LEASE_SECONDS ?? "45", 10);

  const rows = await db.execute(sql`
    with candidate as (
      select j.id
      from property_refresh_jobs j
      where j.superseded_at is null
        and (
          (j.status = 'queued' and j.available_at <= now())
          or (j.status = 'processing' and j.claim_expires_at < now())
        )
      order by j.created_at asc
      for update skip locked
      limit 1
    )
    update property_refresh_jobs j
    set
      status = 'processing',
      claimed_by = ${workerId},
      claimed_at = now(),
      heartbeat_at = now(),
      claim_expires_at = now() + (${leaseSeconds} || ' seconds')::interval,
      started_at = coalesce(j.started_at, now()),
      attempts = j.attempts + 1,
      updated_at = now()
    from candidate
    where j.id = candidate.id
    returning j.*
  `);

  const claimedRows = rows as unknown as Array<Record<string, unknown>>;
  return normalizeClaimedPropertyRefreshJobRow(claimedRows[0]);
}

export async function heartbeatPropertyRefreshJob(jobId: string, workerId: string) {
  const leaseSeconds = parseInt(process.env.PROPERTY_REFRESH_WORKER_LEASE_SECONDS ?? "45", 10);
  const [job] = await db
    .update(propertyRefreshJobs)
    .set({
      heartbeatAt: new Date(),
      claimExpiresAt: sql`now() + (${leaseSeconds} || ' seconds')::interval`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(propertyRefreshJobs.id, jobId),
        eq(propertyRefreshJobs.status, "processing"),
        eq(propertyRefreshJobs.claimedBy, workerId),
      ),
    )
    .returning();
  return job ?? null;
}

export async function updatePropertyRefreshJobProgress(params: {
  jobId: string;
  phase: string;
  message?: string | null;
  progressMeta?: Record<string, unknown> | null;
}) {
  const [job] = await db
    .update(propertyRefreshJobs)
    .set({
      phase: params.phase,
      message: params.message ?? null,
      progressMeta: params.progressMeta ?? null,
      updatedAt: new Date(),
    })
    .where(eq(propertyRefreshJobs.id, params.jobId))
    .returning();
  return job ?? null;
}

export async function completePropertyRefreshJob(jobId: string, message?: string | null, progressMeta?: Record<string, unknown> | null) {
  const [job] = await db
    .update(propertyRefreshJobs)
    .set({
      status: "complete",
      phase: "done",
      message: message ?? "Refresh complete",
      progressMeta: progressMeta ?? null,
      finishedAt: new Date(),
      claimExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(propertyRefreshJobs.id, jobId))
    .returning();
  return job ?? null;
}

export async function failPropertyRefreshJob(jobId: string, errorMessage: string, phase = "failed", progressMeta?: Record<string, unknown> | null) {
  const [job] = await db
    .update(propertyRefreshJobs)
    .set({
      status: "failed",
      phase,
      message: "Refresh failed",
      progressMeta: progressMeta ?? null,
      lastError: errorMessage,
      finishedAt: new Date(),
      claimExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(propertyRefreshJobs.id, jobId))
    .returning();
  return job ?? null;
}

export async function getLatestPropertyRefreshState(teamId: string, propertyId: string): Promise<PropertyRefreshState | null> {
  const row = await db.query.propertyRefreshJobs.findFirst({
    where: and(
      eq(propertyRefreshJobs.teamId, teamId),
      eq(propertyRefreshJobs.propertyId, propertyId),
      isNull(propertyRefreshJobs.supersededAt),
    ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt)],
  });

  return row ? normalizePropertyRefreshRow(row) : null;
}

export async function getLatestPropertyRefreshJob(teamId: string, propertyId: string) {
  return db.query.propertyRefreshJobs.findFirst({
    where: and(
      eq(propertyRefreshJobs.teamId, teamId),
      eq(propertyRefreshJobs.propertyId, propertyId),
      isNull(propertyRefreshJobs.supersededAt),
    ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt)],
  });
}

export async function storePropertyCrawlSnapshot(params: {
  teamId: string;
  propertyId: string;
  refreshJobId?: string | null;
  crawlData: CrawlResult;
  source?: "property_refresh" | "report_fallback";
}) {
  const serialized = JSON.stringify(params.crawlData);
  const [row] = await db
    .insert(propertyCrawlSnapshots)
    .values({
      id: `pcs_${nanoid(12)}`,
      teamId: params.teamId,
      propertyId: params.propertyId,
      refreshJobId: params.refreshJobId ?? null,
      source: params.source ?? "property_refresh",
      crawlData: params.crawlData,
      pageCount: params.crawlData.pages.length,
      fingerprint: serialized,
    })
    .returning();
  return row;
}

export async function getLatestPropertyCrawl(params: {
  teamId: string;
  propertyId: string;
}): Promise<{
  crawl: CrawlResult | null;
  createdAt: string | null;
  source: "property_refresh" | "report_fallback" | null;
  fingerprint: string | null;
} | null> {
  const snapshot = await db.query.propertyCrawlSnapshots.findFirst({
    where: and(
      eq(propertyCrawlSnapshots.teamId, params.teamId),
      eq(propertyCrawlSnapshots.propertyId, params.propertyId),
    ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.createdAt)],
  });

  if (snapshot) {
    return {
      crawl: snapshot.crawlData as CrawlResult,
      createdAt: snapshot.createdAt.toISOString(),
      source: snapshot.source as "property_refresh" | "report_fallback",
      fingerprint: snapshot.fingerprint ?? null,
    };
  }

  const fallbackReports = await db.query.reports.findMany({
    where: (table, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(table.teamId, params.teamId), eqFn(table.propertyId, params.propertyId)),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt), descOrder(table.createdAt)],
    limit: 10,
  });

  for (const report of fallbackReports) {
    const crawl = readStoredCrawlData(report.data);
    if (!crawl) continue;
    return {
      crawl,
      createdAt: report.updatedAt.toISOString(),
      source: "report_fallback",
      fingerprint: JSON.stringify(crawl),
    };
  }

  return {
    crawl: null,
    createdAt: null,
    source: null,
    fingerprint: null,
  };
}

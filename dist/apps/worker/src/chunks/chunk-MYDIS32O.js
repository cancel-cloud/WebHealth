import {
  db
} from "./chunk-DG7CE5Z4.js";
import {
  propertyCrawlSnapshots,
  propertyRefreshJobs
} from "./chunk-NLKMMEGJ.js";

// packages/shared/src/lib/property-refresh.ts
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
function matchesPropertyRefreshPayload(candidate, target) {
  const normalize = (value) => typeof value === "string" && value.length ? value : null;
  return normalize(candidate?.preset) === normalize(target?.preset) && normalize(candidate?.compareMode) === normalize(target?.compareMode) && normalize(candidate?.startDate) === normalize(target?.startDate) && normalize(candidate?.endDate) === normalize(target?.endDate);
}
function normalizePropertyRefreshRow(row) {
  return {
    id: row.id,
    jobType: row.jobType,
    status: row.status,
    phase: row.phase,
    message: row.message ?? null,
    progressMeta: row.progressMeta ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString()
  };
}
function readStoredCrawlData(value) {
  if (!value || typeof value !== "object") return null;
  const data = value;
  const crawl = data.crawl;
  if (!crawl || typeof crawl !== "object") return null;
  const parsed = crawl;
  if (!Array.isArray(parsed.pages) || !parsed.summary || typeof parsed.summary !== "object") {
    return null;
  }
  return parsed;
}
function normalizeClaimedPropertyRefreshJobRow(row) {
  if (!row) return null;
  const readDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const readString = (value) => typeof value === "string" ? value : null;
  return {
    id: String(row.id ?? ""),
    teamId: String(row.team_id ?? row.teamId ?? ""),
    propertyId: String(row.property_id ?? row.propertyId ?? ""),
    triggeredByUserId: readString(row.triggered_by_user_id ?? row.triggeredByUserId),
    jobType: String(row.job_type ?? row.jobType ?? ""),
    status: String(row.status ?? ""),
    phase: String(row.phase ?? ""),
    message: typeof row.message === "string" ? row.message : null,
    progressMeta: row.progress_meta ?? row.progressMeta ?? null,
    payload: row.payload ?? null,
    lastError: typeof (row.last_error ?? row.lastError) === "string" ? String(row.last_error ?? row.lastError) : null,
    availableAt: readDate(row.available_at ?? row.availableAt) ?? /* @__PURE__ */ new Date(),
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? row.maxAttempts ?? 0),
    claimedBy: typeof (row.claimed_by ?? row.claimedBy) === "string" ? String(row.claimed_by ?? row.claimedBy) : null,
    claimedAt: readDate(row.claimed_at ?? row.claimedAt),
    claimExpiresAt: readDate(row.claim_expires_at ?? row.claimExpiresAt),
    heartbeatAt: readDate(row.heartbeat_at ?? row.heartbeatAt),
    startedAt: readDate(row.started_at ?? row.startedAt),
    finishedAt: readDate(row.finished_at ?? row.finishedAt),
    supersededAt: readDate(row.superseded_at ?? row.supersededAt),
    createdAt: readDate(row.created_at ?? row.createdAt) ?? /* @__PURE__ */ new Date(),
    updatedAt: readDate(row.updated_at ?? row.updatedAt) ?? /* @__PURE__ */ new Date()
  };
}
async function claimNextPropertyRefreshJob(workerId) {
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
  const claimedRows = rows;
  return normalizeClaimedPropertyRefreshJobRow(claimedRows[0]);
}
async function heartbeatPropertyRefreshJob(jobId, workerId) {
  const leaseSeconds = parseInt(process.env.PROPERTY_REFRESH_WORKER_LEASE_SECONDS ?? "45", 10);
  const [job] = await db.update(propertyRefreshJobs).set({
    heartbeatAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: sql`now() + (${leaseSeconds} || ' seconds')::interval`,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(
    and(
      eq(propertyRefreshJobs.id, jobId),
      eq(propertyRefreshJobs.status, "processing"),
      eq(propertyRefreshJobs.claimedBy, workerId)
    )
  ).returning();
  return job ?? null;
}
async function updatePropertyRefreshJobProgress(params) {
  const [job] = await db.update(propertyRefreshJobs).set({
    phase: params.phase,
    message: params.message ?? null,
    progressMeta: params.progressMeta ?? null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(propertyRefreshJobs.id, params.jobId)).returning();
  return job ?? null;
}
async function completePropertyRefreshJob(jobId, message, progressMeta) {
  const [job] = await db.update(propertyRefreshJobs).set({
    status: "complete",
    phase: "done",
    message: message ?? "Refresh complete",
    progressMeta: progressMeta ?? null,
    finishedAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(propertyRefreshJobs.id, jobId)).returning();
  return job ?? null;
}
async function failPropertyRefreshJob(jobId, errorMessage, phase = "failed", progressMeta) {
  const [job] = await db.update(propertyRefreshJobs).set({
    status: "failed",
    phase,
    message: "Refresh failed",
    progressMeta: progressMeta ?? null,
    lastError: errorMessage,
    finishedAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(propertyRefreshJobs.id, jobId)).returning();
  return job ?? null;
}
async function getLatestPropertyRefreshState(teamId, propertyId) {
  return getLatestPropertyRefreshStateForWindow({ teamId, propertyId });
}
async function getLatestPropertyRefreshStateForWindow(params) {
  const row = await db.query.propertyRefreshJobs.findFirst({
    where: and(
      eq(propertyRefreshJobs.teamId, params.teamId),
      eq(propertyRefreshJobs.propertyId, params.propertyId),
      isNull(propertyRefreshJobs.supersededAt)
    ),
    orderBy: (table, { desc: descOrder, asc: ascOrder, sql: sqlOrder }) => [
      sqlOrder`case when ${table.status} in ('queued', 'processing') then 0 else 1 end`,
      descOrder(table.updatedAt),
      ascOrder(table.createdAt)
    ]
  });
  if (!row) return null;
  if (!params.payload) return normalizePropertyRefreshRow(row);
  const matchingRows = await db.query.propertyRefreshJobs.findMany({
    where: and(
      eq(propertyRefreshJobs.teamId, params.teamId),
      eq(propertyRefreshJobs.propertyId, params.propertyId),
      isNull(propertyRefreshJobs.supersededAt)
    ),
    orderBy: (table, { desc: descOrder, asc: ascOrder, sql: sqlOrder }) => [
      sqlOrder`case when ${table.status} in ('queued', 'processing') then 0 else 1 end`,
      descOrder(table.updatedAt),
      ascOrder(table.createdAt)
    ]
  });
  const matchingRow = matchingRows.find((candidate) => matchesPropertyRefreshPayload(
    candidate.payload ?? null,
    params.payload
  ));
  return matchingRow ? normalizePropertyRefreshRow(matchingRow) : null;
}
async function storePropertyCrawlSnapshot(params) {
  const serialized = JSON.stringify(params.crawlData);
  const [row] = await db.insert(propertyCrawlSnapshots).values({
    id: `pcs_${nanoid(12)}`,
    teamId: params.teamId,
    propertyId: params.propertyId,
    refreshJobId: params.refreshJobId ?? null,
    source: params.source ?? "property_refresh",
    crawlData: params.crawlData,
    pageCount: params.crawlData.pages.length,
    fingerprint: serialized
  }).returning();
  return row;
}
async function getLatestPropertyCrawl(params) {
  const snapshot = await db.query.propertyCrawlSnapshots.findFirst({
    where: and(
      eq(propertyCrawlSnapshots.teamId, params.teamId),
      eq(propertyCrawlSnapshots.propertyId, params.propertyId)
    ),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.createdAt)]
  });
  if (snapshot) {
    return {
      crawl: snapshot.crawlData,
      createdAt: snapshot.createdAt.toISOString(),
      source: snapshot.source,
      fingerprint: snapshot.fingerprint ?? null
    };
  }
  const fallbackReports = await db.query.reports.findMany({
    where: (table, { and: andFn, eq: eqFn }) => andFn(eqFn(table.teamId, params.teamId), eqFn(table.propertyId, params.propertyId)),
    orderBy: (table, { desc: descOrder }) => [descOrder(table.updatedAt), descOrder(table.createdAt)],
    limit: 10
  });
  for (const report of fallbackReports) {
    const crawl = readStoredCrawlData(report.data);
    if (!crawl) continue;
    return {
      crawl,
      createdAt: report.updatedAt.toISOString(),
      source: "report_fallback",
      fingerprint: JSON.stringify(crawl)
    };
  }
  return {
    crawl: null,
    createdAt: null,
    source: null,
    fingerprint: null
  };
}

export {
  claimNextPropertyRefreshJob,
  heartbeatPropertyRefreshJob,
  updatePropertyRefreshJobProgress,
  completePropertyRefreshJob,
  failPropertyRefreshJob,
  getLatestPropertyRefreshState,
  getLatestPropertyRefreshStateForWindow,
  storePropertyCrawlSnapshot,
  getLatestPropertyCrawl
};

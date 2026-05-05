import {
  db
} from "./chunk-MHPXHZHS.js";
import {
  propertyCrawlSnapshots,
  propertyPageRegistry,
  propertyRefreshJobs
} from "./chunk-LQXSOOFX.js";

// packages/shared/src/lib/property-refresh.ts
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// packages/shared/src/lib/property-refresh-policy.ts
import { createHash } from "crypto";
function matchesPropertyRefreshPayload(candidate, target) {
  const normalize = (value) => typeof value === "string" && value.length ? value : null;
  return normalize(candidate?.preset) === normalize(target?.preset) && normalize(candidate?.compareMode) === normalize(target?.compareMode) && normalize(candidate?.startDate) === normalize(target?.startDate) && normalize(candidate?.endDate) === normalize(target?.endDate);
}
function getPropertyRefreshTriggerSource(payload) {
  const value = typeof payload?.triggerSource === "string" ? payload.triggerSource : null;
  return value === "automation" || value === "scheduler" ? "automation" : "manual";
}
function shouldSupersedePropertyRefreshJob(input) {
  if (input.incomingSource === "manual") return true;
  return input.existingSource === "automation";
}
function normalizeWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}
function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}
function buildPropertyPageFingerprint(page) {
  const canonicalUrl = normalizeWhitespace(page.canonicalUrl || page.url || "");
  return sha256(
    JSON.stringify({
      url: canonicalUrl,
      title: normalizeWhitespace(page.title ?? ""),
      metaDescription: normalizeWhitespace(page.metaDescription ?? ""),
      h1Texts: (page.h1Texts ?? []).map((h) => normalizeWhitespace(h)).filter(Boolean),
      text: normalizeWhitespace(page.visibleTextExcerpt ?? "")
    })
  );
}
function buildPropertyPageRegistryChanges(input) {
  const fingerprintPage = input.fingerprintPage ?? buildPropertyPageFingerprint;
  const registryByCanonical = new Map(input.existing.map((row) => [row.canonicalUrl, row]));
  const activeRegistryRows = input.existing.filter((row) => row.isActive);
  const seenCanonicalUrls = /* @__PURE__ */ new Set();
  const upserts = [];
  const siteChanges = { newPages: [], changedPages: [], removedPages: [] };
  for (const page of input.pages) {
    const canonicalUrl = (page.canonicalUrl || page.url || "").trim();
    if (!canonicalUrl || seenCanonicalUrls.has(canonicalUrl)) continue;
    seenCanonicalUrls.add(canonicalUrl);
    const nextFingerprint = fingerprintPage(page);
    const registry = registryByCanonical.get(canonicalUrl);
    const isNew = !registry || !registry.isActive;
    const isChanged = Boolean(registry && registry.currentFingerprintHash !== nextFingerprint);
    if (isNew) {
      siteChanges.newPages.push({ url: canonicalUrl });
    } else if (isChanged) {
      siteChanges.changedPages.push({
        url: canonicalUrl,
        changedFields: ["seoFingerprint"],
        machineDiffSummary: "SEO-relevant page fingerprint changed."
      });
    }
    upserts.push({
      registryId: registry?.id ?? null,
      canonicalUrl,
      currentFingerprintHash: nextFingerprint,
      isNew,
      isChanged
    });
  }
  const removedRows = activeRegistryRows.filter((row) => !seenCanonicalUrls.has(row.canonicalUrl));
  siteChanges.removedPages = removedRows.map((row) => ({ url: row.canonicalUrl }));
  return {
    siteChanges,
    upserts,
    removedIds: removedRows.map((row) => row.id)
  };
}

// packages/shared/src/lib/property-refresh.ts
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
async function enqueuePropertyRefreshJob(input) {
  const triggerSource = input.triggerSource ?? getPropertyRefreshTriggerSource(input.payload);
  const supersededAt = /* @__PURE__ */ new Date();
  const activeJobs = await db.query.propertyRefreshJobs.findMany({
    where: and(
      eq(propertyRefreshJobs.teamId, input.teamId),
      eq(propertyRefreshJobs.propertyId, input.propertyId),
      eq(propertyRefreshJobs.jobType, input.jobType),
      isNull(propertyRefreshJobs.supersededAt),
      inArray(propertyRefreshJobs.status, ["queued", "processing"])
    ),
    columns: { id: true, payload: true }
  });
  const supersededIds = activeJobs.filter(
    (job2) => shouldSupersedePropertyRefreshJob({
      incomingSource: triggerSource,
      existingSource: getPropertyRefreshTriggerSource(
        job2.payload ?? null
      )
    })
  ).map((job2) => job2.id);
  if (supersededIds.length > 0) {
    await db.update(propertyRefreshJobs).set({
      supersededAt,
      updatedAt: supersededAt
    }).where(inArray(propertyRefreshJobs.id, supersededIds));
  }
  const [job] = await db.insert(propertyRefreshJobs).values({
    id: `prj_${nanoid(12)}`,
    teamId: input.teamId,
    propertyId: input.propertyId,
    triggeredByUserId: input.triggeredByUserId ?? null,
    jobType: input.jobType,
    status: "queued",
    phase: "queued",
    message: input.jobType === "crawl_refresh" ? triggerSource === "automation" ? "Background technical refresh queued" : "Technical refresh queued" : triggerSource === "automation" ? "Background decision refresh queued" : "Decision refresh queued",
    payload: {
      ...input.payload ?? {},
      triggerSource
    },
    updatedAt: /* @__PURE__ */ new Date()
  }).returning();
  return normalizePropertyRefreshRow(job);
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
    triggeredByUserId: readString(
      row.triggered_by_user_id ?? row.triggeredByUserId
    ),
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
function buildPropertyRefreshClaimLaneSql(lane) {
  if (lane === "manual") {
    return sql`coalesce(j.payload->>'triggerSource', 'manual') not in ('automation', 'scheduler')`;
  }
  if (lane === "automation") {
    return sql`j.payload->>'triggerSource' in ('automation', 'scheduler')`;
  }
  return sql`true`;
}
function buildPropertyRefreshClaimOrderSql(lane) {
  if (lane !== "all") return sql`j.created_at asc`;
  return sql`case when coalesce(j.payload->>'triggerSource', 'manual') in ('automation', 'scheduler') then 1 else 0 end asc, j.created_at asc`;
}
async function claimNextPropertyRefreshJob(workerId, options = {}) {
  const leaseSeconds = parseInt(
    process.env.PROPERTY_REFRESH_WORKER_LEASE_SECONDS ?? "45",
    10
  );
  const lane = options.lane ?? "manual";
  const laneSql = buildPropertyRefreshClaimLaneSql(lane);
  const orderSql = buildPropertyRefreshClaimOrderSql(lane);
  const rows = await db.execute(sql`
    with candidate as (
      select j.id
      from property_refresh_jobs j
      where j.superseded_at is null
        and ${laneSql}
        and (
          (j.status = 'queued' and j.available_at <= now())
          or (j.status = 'processing' and j.claim_expires_at < now())
        )
      order by ${orderSql}
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
      started_at = coalesce(j.started_at, now() at time zone 'utc'),
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
  const leaseSeconds = parseInt(
    process.env.PROPERTY_REFRESH_WORKER_LEASE_SECONDS ?? "45",
    10
  );
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
  }).where(
    and(
      eq(propertyRefreshJobs.id, params.jobId),
      eq(propertyRefreshJobs.status, "processing"),
      eq(propertyRefreshJobs.claimedBy, params.workerId)
    )
  ).returning();
  return job ?? null;
}
async function completePropertyRefreshJob(params) {
  const [job] = await db.update(propertyRefreshJobs).set({
    status: "complete",
    phase: "done",
    message: params.message ?? "Refresh complete",
    progressMeta: params.progressMeta ?? null,
    finishedAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(
    and(
      eq(propertyRefreshJobs.id, params.jobId),
      eq(propertyRefreshJobs.status, "processing"),
      eq(propertyRefreshJobs.claimedBy, params.workerId)
    )
  ).returning();
  return job ?? null;
}
async function failPropertyRefreshJob(params) {
  const [job] = await db.update(propertyRefreshJobs).set({
    status: "failed",
    phase: params.phase ?? "failed",
    message: "Refresh failed",
    progressMeta: params.progressMeta ?? null,
    lastError: params.errorMessage,
    finishedAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(
    and(
      eq(propertyRefreshJobs.id, params.jobId),
      eq(propertyRefreshJobs.status, "processing"),
      eq(propertyRefreshJobs.claimedBy, params.workerId)
    )
  ).returning();
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
  const matchingRow = matchingRows.find(
    (candidate) => matchesPropertyRefreshPayload(
      candidate.payload ?? null,
      params.payload
    )
  );
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
  const registryRows = await db.query.propertyPageRegistry.findMany({
    where: and(
      eq(propertyPageRegistry.teamId, params.teamId),
      eq(propertyPageRegistry.propertyId, params.propertyId)
    ),
    columns: {
      id: true,
      canonicalUrl: true,
      currentFingerprintHash: true,
      isActive: true,
      lastChangedAt: true
    }
  });
  const registryChanges = buildPropertyPageRegistryChanges({
    existing: registryRows,
    pages: params.crawlData.pages
  });
  const now = /* @__PURE__ */ new Date();
  for (const change of registryChanges.upserts) {
    if (!change.registryId) {
      await db.insert(propertyPageRegistry).values({
        id: `ppr_${nanoid(12)}`,
        propertyId: params.propertyId,
        teamId: params.teamId,
        canonicalUrl: change.canonicalUrl,
        currentFingerprintHash: change.currentFingerprintHash,
        currentSnapshotId: row.id,
        firstSeenAt: now,
        lastSeenAt: now,
        lastChangedAt: now,
        isActive: true,
        updatedAt: now
      });
      continue;
    }
    await db.update(propertyPageRegistry).set({
      currentFingerprintHash: change.currentFingerprintHash,
      currentSnapshotId: row.id,
      lastSeenAt: now,
      lastChangedAt: change.isChanged || change.isNew ? now : void 0,
      isActive: true,
      updatedAt: now
    }).where(eq(propertyPageRegistry.id, change.registryId));
  }
  if (registryChanges.removedIds.length > 0) {
    await db.update(propertyPageRegistry).set({ isActive: false, updatedAt: now }).where(inArray(propertyPageRegistry.id, registryChanges.removedIds));
  }
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
      source: "property_refresh",
      fingerprint: snapshot.fingerprint ?? null
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
  enqueuePropertyRefreshJob,
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

import {
  db
} from "./chunk-DG7CE5Z4.js";
import {
  productEvents,
  reportJobEvents,
  reportJobs
} from "./chunk-NLKMMEGJ.js";

// packages/shared/src/lib/queue/report-jobs.ts
import { nanoid } from "nanoid";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

// packages/shared/src/lib/queue/report-job-row-shape.ts
var snakeToCamelClaimJobKeys = [
  ["report_id", "reportId"],
  ["team_id", "teamId"],
  ["available_at", "availableAt"],
  ["max_attempts", "maxAttempts"],
  ["claimed_by", "claimedBy"],
  ["claimed_at", "claimedAt"],
  ["claim_expires_at", "claimExpiresAt"],
  ["heartbeat_at", "heartbeatAt"],
  ["started_at", "startedAt"],
  ["finished_at", "finishedAt"],
  ["last_error", "lastError"],
  ["created_at", "createdAt"],
  ["updated_at", "updatedAt"]
];
function normalizeClaimedReportJobRow(row) {
  const normalized = { ...row };
  for (const [snakeKey, camelKey] of snakeToCamelClaimJobKeys) {
    if (!(camelKey in normalized) && snakeKey in normalized) {
      normalized[camelKey] = normalized[snakeKey];
    }
  }
  return normalized;
}

// packages/shared/src/lib/queue/report-jobs.ts
function getQueueLeaseConfig() {
  return {
    leaseSeconds: parseInt(process.env.REPORT_WORKER_LEASE_SECONDS ?? "45", 10),
    heartbeatSeconds: parseInt(process.env.REPORT_WORKER_HEARTBEAT_SECONDS ?? "10", 10),
    maxActiveGlobal: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_GLOBAL ?? "2", 10),
    maxActivePerTeam: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_PER_TEAM ?? "1", 10),
    maxActiveDetailGlobal: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_DETAILS_GLOBAL ?? "6", 10),
    maxActiveDetailPerTeam: parseInt(process.env.REPORT_WORKER_MAX_ACTIVE_DETAILS_PER_TEAM ?? "3", 10)
  };
}
async function enqueueReportJob(input) {
  const jobId = `rj_${nanoid(12)}`;
  const [job] = await db.insert(reportJobs).values({
    id: jobId,
    reportId: input.reportId,
    teamId: input.teamId,
    kind: input.kind,
    priority: input.priority ?? 100,
    payload: input.payload ?? {},
    phase: "queued",
    status: "queued"
  }).returning();
  await appendReportJobEvent({
    jobId,
    reportId: input.reportId,
    teamId: input.teamId,
    phase: "queued",
    level: "info",
    message: `Job enqueued (${input.kind})`
  });
  await db.execute(sql`SELECT pg_notify('job_available', '')`);
  return job;
}
async function appendReportJobEvent(input) {
  const [event] = await db.insert(reportJobEvents).values({
    id: `rje_${nanoid(12)}`,
    jobId: input.jobId,
    reportId: input.reportId,
    teamId: input.teamId,
    phase: input.phase,
    level: input.level ?? "info",
    message: input.message,
    meta: input.meta ?? null
  }).returning();
  return event;
}
async function claimNextReportJob(workerId) {
  const cfg = getQueueLeaseConfig();
  const rows = await db.transaction(async (tx) => {
    const result = await tx.execute(sql`
      with candidate as (
        select j.id
        from report_jobs j
        where (
          (j.status = 'queued' and j.available_at <= now())
          or (j.status = 'processing' and j.claim_expires_at < now())
        )
        and case
          when j.kind = 'generate_detail' then (
            select count(*) from report_jobs g
            where g.status = 'processing'
              and g.claim_expires_at > now()
              and g.kind = 'generate_detail'
          ) < ${cfg.maxActiveDetailGlobal}
          else (
            select count(*) from report_jobs g
            where g.status = 'processing'
              and g.claim_expires_at > now()
              and g.kind <> 'generate_detail'
          ) < ${cfg.maxActiveGlobal}
        end
        and case
          when j.kind = 'generate_detail' then (
            select count(*) from report_jobs t
            where t.status = 'processing'
              and t.claim_expires_at > now()
              and t.team_id = j.team_id
              and t.kind = 'generate_detail'
          ) < ${cfg.maxActiveDetailPerTeam}
          else (
            select count(*) from report_jobs t
            where t.status = 'processing'
              and t.claim_expires_at > now()
              and t.team_id = j.team_id
              and t.kind <> 'generate_detail'
          ) < ${cfg.maxActivePerTeam}
        end
        order by j.priority asc, j.created_at asc
        for update skip locked
        limit 1
      )
      update report_jobs j
      set
        status = 'processing',
        claimed_by = ${workerId},
        claimed_at = now(),
        heartbeat_at = now(),
        claim_expires_at = now() + (${cfg.leaseSeconds} || ' seconds')::interval,
        started_at = coalesce(j.started_at, now()),
        attempts = j.attempts + 1,
        updated_at = now()
      from candidate
      where j.id = candidate.id
      returning j.*
    `);
    return result;
  });
  const rawRow = rows[0] ?? null;
  const row = rawRow ? normalizeClaimedReportJobRow(rawRow) : null;
  if (!row) return null;
  await appendReportJobEvent({
    jobId: row.id,
    reportId: row.reportId,
    teamId: row.teamId,
    phase: row.phase,
    level: "info",
    message: `Job claimed by ${workerId}`,
    meta: { leaseSeconds: cfg.leaseSeconds }
  });
  return row;
}
async function heartbeatReportJob(jobId, workerId) {
  const cfg = getQueueLeaseConfig();
  const [job] = await db.update(reportJobs).set({
    heartbeatAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: sql`now() + (${cfg.leaseSeconds} || ' seconds')::interval`,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(
    and(eq(reportJobs.id, jobId), eq(reportJobs.status, "processing"), eq(reportJobs.claimedBy, workerId))
  ).returning();
  return job ?? null;
}
async function updateReportJobPhase(jobId, phase, meta) {
  const [job] = await db.update(reportJobs).set({ phase, updatedAt: /* @__PURE__ */ new Date() }).where(eq(reportJobs.id, jobId)).returning();
  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase,
      level: "info",
      message: `Phase -> ${phase}`,
      meta
    });
  }
  return job ?? null;
}
async function completeReportJob(jobId, phase = "done") {
  const [job] = await db.update(reportJobs).set({
    status: "complete",
    phase,
    finishedAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: null,
    heartbeatAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(reportJobs.id, jobId)).returning();
  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase,
      level: "info",
      message: "Job completed"
    });
  }
  return job ?? null;
}
async function requeueJobForRetry(jobId, errorMessage, delaySeconds = 30) {
  const [job] = await db.update(reportJobs).set({
    status: "queued",
    phase: "queued",
    claimedBy: null,
    claimedAt: null,
    claimExpiresAt: null,
    heartbeatAt: null,
    finishedAt: null,
    lastError: errorMessage,
    availableAt: sql`now() + (${delaySeconds} || ' seconds')::interval`,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(reportJobs.id, jobId)).returning();
  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "queued",
      level: "warn",
      message: `Job re-queued for retry (attempt ${job.attempts} of ${job.maxAttempts}): ${errorMessage}`
    });
  }
  return job ?? null;
}
async function failReportJob(jobId, errorMessage, phase) {
  const [job] = await db.update(reportJobs).set({
    status: "failed",
    lastError: errorMessage,
    phase: phase ?? "done",
    finishedAt: /* @__PURE__ */ new Date(),
    claimExpiresAt: null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(reportJobs.id, jobId)).returning();
  if (job) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: job.phase,
      level: "error",
      message: errorMessage
    });
  }
  return job ?? null;
}
async function findLatestJobForReport(reportId, kinds) {
  const filters = [eq(reportJobs.reportId, reportId)];
  if (kinds?.length) filters.push(inArray(reportJobs.kind, kinds));
  return db.query.reportJobs.findFirst({
    where: and(...filters),
    orderBy: (j, { desc: desc2 }) => [desc2(j.createdAt)]
  });
}

// packages/shared/src/lib/product-event-store.ts
import { nanoid as nanoid2 } from "nanoid";

// packages/shared/src/lib/product-events.ts
var PII_KEYS = /* @__PURE__ */ new Set([
  "email",
  "emailAddress",
  "name",
  "userName",
  "fullName"
]);
function sanitizeProductEventProperties(input) {
  const sanitized = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (PII_KEYS.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}
function buildProductEventPayload(input) {
  return {
    teamId: input.teamId,
    userId: input.userId ?? null,
    name: input.name,
    source: input.source,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    properties: sanitizeProductEventProperties(input.properties)
  };
}
function shouldSendPosthogEvent(config) {
  return Boolean(config.apiKey);
}
function buildPosthogCapturePayload(config, input) {
  if (!shouldSendPosthogEvent(config)) return null;
  return {
    api_key: config.apiKey,
    event: input.name,
    distinct_id: input.userId ?? input.teamId,
    properties: {
      teamId: input.teamId,
      userId: input.userId,
      source: input.source,
      entityType: input.entityType,
      entityId: input.entityId,
      ...input.properties
    }
  };
}

// packages/shared/src/lib/product-event-store.ts
async function recordProductEvent(input) {
  const payload = buildProductEventPayload(input);
  await db.insert(productEvents).values({
    id: `pe_${nanoid2(12)}`,
    teamId: payload.teamId,
    userId: payload.userId,
    name: payload.name,
    source: payload.source,
    entityType: payload.entityType,
    entityId: payload.entityId,
    properties: payload.properties
  });
  await sendPosthogCapture(payload);
}
async function sendPosthogCapture(payload) {
  const capturePayload = buildPosthogCapturePayload(
    {
      apiKey: process.env.POSTHOG_API_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY,
      host: process.env.POSTHOG_HOST
    },
    payload
  );
  if (!capturePayload) return;
  const host = process.env.POSTHOG_HOST ?? "https://app.posthog.com";
  try {
    await fetch(`${host.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(capturePayload)
    });
  } catch (error) {
    console.warn("[product-events] PostHog capture failed", error);
  }
}

// packages/shared/src/lib/weekly-review.ts
var MS_PER_DAY = 24 * 60 * 60 * 1e3;
function parseDateOnly(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}
function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}
function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}
function normalizeUrl(value) {
  return value.trim().replace(/\/+$/, "");
}
function buildWeeklyReviewRunKey(input) {
  return `${input.teamId}:${input.propertyId}:${input.dateRangeStart}:${input.dateRangeEnd}`;
}
function getWeeklyReviewWindow(latestAvailableDate) {
  const latest = parseDateOnly(latestAvailableDate);
  const day = latest.getUTCDay();
  const daysSinceSunday = day === 0 ? 0 : day;
  const currentEnd = addDays(latest, -daysSinceSunday);
  const currentStart = addDays(currentEnd, -6);
  const compareEnd = addDays(currentStart, -1);
  const compareStart = addDays(compareEnd, -6);
  return {
    dateRangeStart: formatDateOnly(currentStart),
    dateRangeEnd: formatDateOnly(currentEnd),
    compareRangeStart: formatDateOnly(compareStart),
    compareRangeEnd: formatDateOnly(compareEnd)
  };
}
function shouldRunWeeklyScheduler(now, timeZone = "Europe/Berlin") {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short"
  }).format(now);
  return weekday === "Sun";
}
function buildWeeklyReviewFindings(input) {
  const currentByUrl = new Map(input.currentPages.map((row) => [normalizeUrl(row.page), row]));
  const compareByUrl = new Map(input.comparePages.map((row) => [normalizeUrl(row.page), row]));
  const findings = [];
  for (const page of input.changedPages) {
    const url = normalizeUrl(page.url);
    const current = currentByUrl.get(url);
    const compare = compareByUrl.get(url);
    const clicksCurrent = current?.clicks ?? 0;
    const clicksCompare = compare?.clicks ?? 0;
    const impressionsCurrent = current?.impressions ?? 0;
    const impressionsCompare = compare?.impressions ?? 0;
    if (impressionsCurrent === 0) {
      findings.push({
        type: "no_impressions",
        url: page.url,
        actionable: true,
        clicksCurrent,
        clicksCompare,
        impressionsCurrent,
        impressionsCompare,
        message: "Changed page received no Google impressions in the evaluated week."
      });
      continue;
    }
    if (impressionsCurrent > impressionsCompare && clicksCurrent <= clicksCompare) {
      findings.push({
        type: "impressions_without_clicks",
        url: page.url,
        actionable: true,
        clicksCurrent,
        clicksCompare,
        impressionsCurrent,
        impressionsCompare,
        message: "Google impressions increased, but clicks did not improve."
      });
      continue;
    }
    if (clicksCurrent < clicksCompare || impressionsCurrent < impressionsCompare) {
      findings.push({
        type: "traffic_drop",
        url: page.url,
        actionable: true,
        clicksCurrent,
        clicksCompare,
        impressionsCurrent,
        impressionsCompare,
        message: "Clicks or impressions dropped after the detected page change."
      });
    }
  }
  return findings;
}

export {
  enqueueReportJob,
  appendReportJobEvent,
  claimNextReportJob,
  heartbeatReportJob,
  updateReportJobPhase,
  completeReportJob,
  requeueJobForRetry,
  failReportJob,
  findLatestJobForReport,
  recordProductEvent,
  buildWeeklyReviewRunKey,
  getWeeklyReviewWindow,
  shouldRunWeeklyScheduler,
  buildWeeklyReviewFindings
};

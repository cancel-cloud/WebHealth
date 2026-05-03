import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import {
  account,
  ga4DailyFacts,
  ga4DailyRaw,
  ga4ReportArtifacts,
  gscDailyFacts,
  gscDailyRaw,
  metricsBackfillJobs,
  properties,
  systemLogs,
  teamMembers,
} from "@webhealth/shared/db/schema";
import {
  fetchGa4DailySummary,
  fetchGa4ReportProfileForRange,
  fetchGscMetricsBatch,
  getGoogleAuthClient,
  type GscDayMetrics,
} from "@webhealth/shared/lib/google/api";
import {
  assertMetricsRefreshWindow,
  metricsWindowDaysInclusive,
  type MetricsRefreshWindow,
} from "@webhealth/shared/lib/metrics-window-policy";
import { getGoogleAccountTokensForUser } from "@webhealth/shared/lib/provider-tokens";

type DateString = string;

type PropertyRecord = typeof properties.$inferSelect;
type MetricsBackfillJob = typeof metricsBackfillJobs.$inferSelect;

export type MetricsBackfillReason = "admin_sync" | "report_preflight" | "manual_backfill" | "active_property_daily";
export type MetricsBackfillTriggerSource = "manual" | "automation";

export type MetricsBackfillTotals = {
  gscRequestedDates: number;
  gscFetchedDates: number;
  gscSkippedDates: number;
  gscRefreshedDates: number;
  gscFailedDates: number;
  ga4RequestedDates: number;
  ga4FetchedDates: number;
  ga4SkippedDates: number;
  ga4RefreshedDates: number;
  ga4FailedDates: number;
  gscValidated: number;
  ga4Validated: number;
  gscValidationFailed: number;
  ga4ValidationFailed: number;
};

export type CreateMetricsBackfillJobInput = {
  teamId: string;
  triggeredByUserId: string;
  targetUserId?: string | null;
  targetPropertyId?: string | null;
  includeGsc: boolean;
  includeGa4: boolean;
  dateStart: DateString;
  dateEnd: DateString;
  reason: MetricsBackfillReason;
  timeframeMode?: "preset" | "custom";
  refreshRecentDays?: number;
  triggerSource?: MetricsBackfillTriggerSource;
};

const ZERO_TOTALS = (): MetricsBackfillTotals => ({
  gscRequestedDates: 0,
  gscFetchedDates: 0,
  gscSkippedDates: 0,
  gscRefreshedDates: 0,
  gscFailedDates: 0,
  ga4RequestedDates: 0,
  ga4FetchedDates: 0,
  ga4SkippedDates: 0,
  ga4RefreshedDates: 0,
  ga4FailedDates: 0,
  gscValidated: 0,
  ga4Validated: 0,
  gscValidationFailed: 0,
  ga4ValidationFailed: 0,
});

function toDateString(d: Date): DateString {
  return d.toISOString().slice(0, 10);
}

// postgres-js returns `date` columns as Date objects at runtime even though
// Drizzle types them as `string`. This normalizes either to 'YYYY-MM-DD'.
function normalizeDateStr(val: unknown): DateString {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

export function eachDateInRange(start: DateString, end: DateString): DateString[] {
  const out: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  while (cursor <= last) {
    out.push(toDateString(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

export function rangeDaysInclusive(start: DateString, end: DateString): number {
  return metricsWindowDaysInclusive(start, end);
}

function isWithinFreshWindow(sourceDate: DateString, refreshRecentDays: number): boolean {
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - (refreshRecentDays - 1));
  return new Date(`${sourceDate}T00:00:00.000Z`) >= cutoff;
}

function parseFactNumber(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function upsertGscDayData(params: {
  teamId: string;
  property: PropertyRecord;
  sourceDate: DateString;
  metrics: GscDayMetrics;
  syncJobId?: string | null;
}) {
  const now = new Date();
  const { teamId, property, sourceDate, metrics, syncJobId } = params;
  const rawId = `gscr_${nanoid(12)}`;
  await db
    .insert(gscDailyRaw)
    .values({
      id: rawId,
      teamId,
      propertyId: property.id,
      sourceDate,
      siteUrl: property.url,
      summaryPayload: {
        clicks: metrics.clicks,
        impressions: metrics.impressions,
        ctr: metrics.ctr,
        position: metrics.position,
      },
      queriesPayload: metrics.topQueries,
      pagesPayload: metrics.topPages,
      queryPagePairsPayload: metrics.queryPagePairs,
      countriesPayload: metrics.topCountries,
      devicesPayload: metrics.topDevices,
      fetchedAt: now,
      syncJobId: syncJobId ?? null,
    })
    .onConflictDoUpdate({
      target: [gscDailyRaw.propertyId, gscDailyRaw.sourceDate],
      set: {
        siteUrl: property.url,
        summaryPayload: {
          clicks: metrics.clicks,
          impressions: metrics.impressions,
          ctr: metrics.ctr,
          position: metrics.position,
        },
        queriesPayload: metrics.topQueries,
        pagesPayload: metrics.topPages,
        queryPagePairsPayload: metrics.queryPagePairs,
        countriesPayload: metrics.topCountries,
        devicesPayload: metrics.topDevices,
        fetchedAt: now,
        syncJobId: syncJobId ?? null,
      },
    });

  const factId = `gscf_${nanoid(12)}`;
  await db
    .insert(gscDailyFacts)
    .values({
      id: factId,
      teamId,
      propertyId: property.id,
      sourceDate,
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      ctr: String(metrics.ctr),
      position: String(metrics.position),
      queryCount: metrics.topQueries.length,
      pageCount: metrics.topPages.length,
      fetchedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [gscDailyFacts.propertyId, gscDailyFacts.sourceDate],
      set: {
        clicks: metrics.clicks,
        impressions: metrics.impressions,
        ctr: String(metrics.ctr),
        position: String(metrics.position),
        queryCount: metrics.topQueries.length,
        pageCount: metrics.topPages.length,
        fetchedAt: now,
        updatedAt: now,
      },
    });
}

async function upsertGa4DayData(params: {
  teamId: string;
  gscPropertyId: string | null;
  ga4PropertyId: string;
  sourceDate: DateString;
  metrics: { sessions: number; users: number; newUsers: number };
  syncJobId?: string | null;
}) {
  const now = new Date();
  const { teamId, gscPropertyId, ga4PropertyId, sourceDate, metrics, syncJobId } = params;
  const rawId = `ga4r_${nanoid(12)}`;
  await db
    .insert(ga4DailyRaw)
    .values({
      id: rawId,
      teamId,
      gscPropertyId,
      ga4PropertyId,
      sourceDate,
      runReportPayload: metrics,
      fetchedAt: now,
      syncJobId: syncJobId ?? null,
    })
    .onConflictDoUpdate({
      target: [ga4DailyRaw.ga4PropertyId, ga4DailyRaw.sourceDate],
      set: {
        gscPropertyId,
        runReportPayload: metrics,
        fetchedAt: now,
        syncJobId: syncJobId ?? null,
      },
    });

  const factId = `ga4f_${nanoid(12)}`;
  await db
    .insert(ga4DailyFacts)
    .values({
      id: factId,
      teamId,
      gscPropertyId,
      ga4PropertyId,
      sourceDate,
      sessions: metrics.sessions,
      users: metrics.users,
      newUsers: metrics.newUsers,
      fetchedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [ga4DailyFacts.ga4PropertyId, ga4DailyFacts.sourceDate],
      set: {
        gscPropertyId,
        sessions: metrics.sessions,
        users: metrics.users,
        newUsers: metrics.newUsers,
        fetchedAt: now,
        updatedAt: now,
      },
    });
}

async function upsertGa4ReportArtifact(params: {
  teamId: string;
  gscPropertyId: string | null;
  ga4PropertyId: string;
  dateStart: DateString;
  dateEnd: DateString;
  reportPayload: unknown;
  syncJobId?: string | null;
}) {
  const now = new Date();
  await db
    .insert(ga4ReportArtifacts)
    .values({
      id: `ga4a_${nanoid(12)}`,
      teamId: params.teamId,
      gscPropertyId: params.gscPropertyId,
      ga4PropertyId: params.ga4PropertyId,
      dateStart: params.dateStart,
      dateEnd: params.dateEnd,
      reportPayload: params.reportPayload,
      fetchedAt: now,
      syncJobId: params.syncJobId ?? null,
    })
    .onConflictDoUpdate({
      target: [ga4ReportArtifacts.ga4PropertyId, ga4ReportArtifacts.dateStart, ga4ReportArtifacts.dateEnd],
      set: {
        gscPropertyId: params.gscPropertyId,
        reportPayload: params.reportPayload,
        fetchedAt: now,
        syncJobId: params.syncJobId ?? null,
      },
    });
}

export async function createMetricsBackfillJob(input: CreateMetricsBackfillJobInput) {
  assertMetricsRefreshWindow({ dateStart: input.dateStart, dateEnd: input.dateEnd });
  const [job] = await db
    .insert(metricsBackfillJobs)
    .values({
      id: `mbj_${nanoid(12)}`,
      teamId: input.teamId,
      triggeredByUserId: input.triggeredByUserId,
      targetUserId: input.targetUserId ?? null,
      targetPropertyId: input.targetPropertyId ?? null,
      includeGsc: input.includeGsc,
      includeGa4: input.includeGa4,
      timeframeMode: input.timeframeMode ?? "custom",
      dateStart: input.dateStart,
      dateEnd: input.dateEnd,
      refreshRecentDays: input.refreshRecentDays ?? 7,
      reason: input.reason,
      triggerSource: input.triggerSource ?? "manual",
      status: "queued",
    })
    .returning();
  return job;
}

function normalizeClaimedMetricsBackfillJobRow(row: Record<string, unknown> | null | undefined): MetricsBackfillJob | null {
  if (!row) return null;
  const readDate = (value: unknown) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  return {
    id: String(row.id ?? ""),
    teamId: String(row.team_id ?? row.teamId ?? ""),
    triggeredByUserId: String(row.triggered_by_user_id ?? row.triggeredByUserId ?? ""),
    targetPropertyId: typeof (row.target_property_id ?? row.targetPropertyId) === "string" ? String(row.target_property_id ?? row.targetPropertyId) : null,
    targetUserId: typeof (row.target_user_id ?? row.targetUserId) === "string" ? String(row.target_user_id ?? row.targetUserId) : null,
    includeGsc: Boolean(row.include_gsc ?? row.includeGsc),
    includeGa4: Boolean(row.include_ga4 ?? row.includeGa4),
    timeframeMode: String(row.timeframe_mode ?? row.timeframeMode ?? "custom"),
    dateStart: String(row.date_start ?? row.dateStart ?? ""),
    dateEnd: String(row.date_end ?? row.dateEnd ?? ""),
    refreshRecentDays: Number(row.refresh_recent_days ?? row.refreshRecentDays ?? 7),
    reason: String(row.reason ?? ""),
    status: String(row.status ?? ""),
    triggerSource: String(row.trigger_source ?? row.triggerSource ?? "manual"),
    totals: (row.totals ?? null) as MetricsBackfillJob["totals"],
    error: typeof row.error === "string" ? row.error : null,
    availableAt: readDate(row.available_at ?? row.availableAt) ?? new Date(),
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? row.maxAttempts ?? 2),
    claimedBy: typeof (row.claimed_by ?? row.claimedBy) === "string" ? String(row.claimed_by ?? row.claimedBy) : null,
    claimedAt: readDate(row.claimed_at ?? row.claimedAt),
    claimExpiresAt: readDate(row.claim_expires_at ?? row.claimExpiresAt),
    heartbeatAt: readDate(row.heartbeat_at ?? row.heartbeatAt),
    createdAt: readDate(row.created_at ?? row.createdAt) ?? new Date(),
    startedAt: readDate(row.started_at ?? row.startedAt),
    finishedAt: readDate(row.finished_at ?? row.finishedAt),
  };
}

export async function claimNextMetricsBackfillJob(workerId: string): Promise<MetricsBackfillJob | null> {
  const leaseSeconds = parseInt(process.env.METRICS_BACKFILL_WORKER_LEASE_SECONDS ?? "90", 10);
  const rows = await db.execute(sql`
    with candidate as (
      select j.id
      from metrics_backfill_jobs j
      where (
          (j.status = 'queued' and j.available_at <= now())
          or (j.status = 'processing' and j.claim_expires_at < now() and j.attempts < j.max_attempts)
        )
      order by case when j.trigger_source = 'automation' then 1 else 0 end asc, j.created_at asc
      for update skip locked
      limit 1
    )
    update metrics_backfill_jobs j
    set
      status = 'processing',
      claimed_by = ${workerId},
      claimed_at = now(),
      heartbeat_at = now(),
      claim_expires_at = now() + (${leaseSeconds} || ' seconds')::interval,
      started_at = coalesce(j.started_at, now()),
      attempts = j.attempts + 1
    from candidate
    where j.id = candidate.id
    returning j.*
  `);
  const claimedRows = rows as unknown as Array<Record<string, unknown>>;
  return normalizeClaimedMetricsBackfillJobRow(claimedRows[0]);
}

export async function heartbeatMetricsBackfillJob(jobId: string, workerId: string) {
  const leaseSeconds = parseInt(process.env.METRICS_BACKFILL_WORKER_LEASE_SECONDS ?? "90", 10);
  const [job] = await db
    .update(metricsBackfillJobs)
    .set({
      heartbeatAt: new Date(),
      claimExpiresAt: sql`now() + (${leaseSeconds} || ' seconds')::interval`,
    })
    .where(
      and(
        eq(metricsBackfillJobs.id, jobId),
        eq(metricsBackfillJobs.status, "processing"),
        eq(metricsBackfillJobs.claimedBy, workerId),
      ),
    )
    .returning();
  return job ?? null;
}

async function getGscPropertiesForJob(job: MetricsBackfillJob) {
  if (job.targetPropertyId) {
    return db.query.properties.findMany({
      where: (p, { and, eq }) =>
        and(eq(p.teamId, job.teamId), eq(p.id, job.targetPropertyId!), eq(p.type, "gsc"), eq(p.active, true)),
    });
  }

  return db.query.properties.findMany({
    where: (p, { and, eq }) => and(eq(p.teamId, job.teamId), eq(p.type, "gsc"), eq(p.active, true)),
  });
}

async function existingGscDateSet(propertyId: string, start: DateString, end: DateString) {
  const rows = await db.query.gscDailyFacts.findMany({
    where: (t, { and, eq, gte, lte }) =>
      and(eq(t.propertyId, propertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
    columns: { sourceDate: true },
  });
  return new Set(rows.map((r) => normalizeDateStr(r.sourceDate)));
}

async function existingGa4DateSet(ga4PropertyId: string, start: DateString, end: DateString) {
  const rows = await db.query.ga4DailyFacts.findMany({
    where: (t, { and, eq, gte, lte }) =>
      and(eq(t.ga4PropertyId, ga4PropertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
    columns: { sourceDate: true },
  });
  return new Set(rows.map((r) => normalizeDateStr(r.sourceDate)));
}

export async function processMetricsBackfillJob(args: {
  jobId: string;
  authClient: unknown;
  workerId?: string;
}) {
  const existingJob = await db.query.metricsBackfillJobs.findFirst({
    where: (j, { eq }) => eq(j.id, args.jobId),
  });
  if (!existingJob) throw new Error("Metrics backfill job not found");
  const ownerId = args.workerId ?? `mbi_${nanoid(8)}`;
  const [job] = await db
    .update(metricsBackfillJobs)
    .set({
      status: "processing",
      claimedBy: ownerId,
      claimedAt: existingJob.claimedAt ?? new Date(),
      heartbeatAt: new Date(),
      claimExpiresAt: sql`now() + (${parseInt(process.env.METRICS_BACKFILL_WORKER_LEASE_SECONDS ?? "90", 10)} || ' seconds')::interval`,
      startedAt: existingJob.startedAt ?? new Date(),
      error: null,
    })
    .where(
      args.workerId
        ? and(
            eq(metricsBackfillJobs.id, existingJob.id),
            eq(metricsBackfillJobs.status, "processing"),
            eq(metricsBackfillJobs.claimedBy, ownerId),
          )
        : and(eq(metricsBackfillJobs.id, existingJob.id), eq(metricsBackfillJobs.status, "queued")),
    )
    .returning();
  if (!job) throw new Error("Metrics backfill job lease was lost");

  const totals = ZERO_TOTALS();
  const gscValidatedProps = new Set<string>();
  const gscValidationFailedProps = new Set<string>();
  const ga4ValidatedProps = new Set<string>();
  const ga4ValidationFailedProps = new Set<string>();

  const dateStart = String(job.dateStart);
  const dateEnd = String(job.dateEnd);
  assertMetricsRefreshWindow({ dateStart, dateEnd });
  const dates = eachDateInRange(dateStart, dateEnd);

  try {
    const gscProps = await getGscPropertiesForJob(job);

    if (job.includeGsc) {
      for (const prop of gscProps) {
        const existing = await existingGscDateSet(prop.id, dateStart, dateEnd);

        // Determine which dates actually need fetching
        const datesToFetch = dates.filter((day) => {
          const exists = existing.has(day);
          const fresh = isWithinFreshWindow(day, job.refreshRecentDays);
          return !exists || fresh;
        });

        totals.gscRequestedDates += dates.length;
        totals.gscSkippedDates += dates.length - datesToFetch.length;

        if (datesToFetch.length === 0) {
          gscValidatedProps.add(prop.id);
          continue;
        }

        // Determine the sub-range that needs fetching (contiguous range covering all needed dates)
        const fetchStart = datesToFetch[0];
        const fetchEnd = datesToFetch[datesToFetch.length - 1];

        try {
          const dayMap = await fetchGscMetricsBatch(args.authClient, prop.url, fetchStart, fetchEnd);

          for (const day of datesToFetch) {
            const metrics = dayMap.get(day);
            if (!metrics) {
              // Day had no data in GSC (0 impressions days may be absent from API response)
              // Treat as a zero-data day rather than a failure
              await upsertGscDayData({
                teamId: job.teamId,
                property: prop,
                sourceDate: day,
                metrics: {
                  clicks: 0, impressions: 0, ctr: 0, position: 0,
                  topQueries: [], topPages: [], queryPagePairs: [], topCountries: [], topDevices: [],
                },
                syncJobId: job.id,
              });
              totals.gscFetchedDates++;
              continue;
            }
            await upsertGscDayData({
              teamId: job.teamId,
              property: prop,
              sourceDate: day,
              metrics,
              syncJobId: job.id,
            });
            totals.gscFetchedDates++;
            if (existing.has(day) && isWithinFreshWindow(day, job.refreshRecentDays)) {
              totals.gscRefreshedDates++;
            }
          }
          gscValidatedProps.add(prop.id);
        } catch {
          totals.gscFailedDates += datesToFetch.length;
          gscValidationFailedProps.add(prop.id);
        }
      }
    }

    if (job.includeGa4) {
      const linked = gscProps.filter((p) => !!p.ga4PropertyId);
      for (const prop of linked) {
        const ga4Id = prop.ga4PropertyId!;
        const existing = await existingGa4DateSet(ga4Id, dateStart, dateEnd);

        const datesToFetch = dates.filter((day) => {
          const exists = existing.has(day);
          const fresh = isWithinFreshWindow(day, job.refreshRecentDays);
          return !exists || fresh;
        });

        totals.ga4RequestedDates += dates.length;
        totals.ga4SkippedDates += dates.length - datesToFetch.length;

        if (datesToFetch.length === 0) {
          ga4ValidatedProps.add(ga4Id);
          continue;
        }

        const fetchStart = datesToFetch[0];
        const fetchEnd = datesToFetch[datesToFetch.length - 1];

        try {
          const [dayMap, profile] = await Promise.all([
            fetchGa4DailySummary(args.authClient, ga4Id, fetchStart, fetchEnd),
            fetchGa4ReportProfileForRange(args.authClient, ga4Id, fetchStart, fetchEnd),
          ]);

          for (const day of datesToFetch) {
            const metrics = dayMap.get(day) ?? { sessions: 0, users: 0, newUsers: 0 };
            await upsertGa4DayData({
              teamId: job.teamId,
              gscPropertyId: prop.id,
              ga4PropertyId: ga4Id,
              sourceDate: day,
              metrics,
              syncJobId: job.id,
            });
            totals.ga4FetchedDates++;
            if (existing.has(day) && isWithinFreshWindow(day, job.refreshRecentDays)) {
              totals.ga4RefreshedDates++;
            }
          }
          await upsertGa4ReportArtifact({
            teamId: job.teamId,
            gscPropertyId: prop.id,
            ga4PropertyId: ga4Id,
            dateStart: fetchStart,
            dateEnd: fetchEnd,
            reportPayload: profile,
            syncJobId: job.id,
          });
          ga4ValidatedProps.add(ga4Id);
        } catch {
          totals.ga4FailedDates += datesToFetch.length;
          ga4ValidationFailedProps.add(ga4Id);
        }
      }
    }

    totals.gscValidated = gscValidatedProps.size;
    totals.ga4Validated = ga4ValidatedProps.size;
    totals.gscValidationFailed = gscValidationFailedProps.size;
    totals.ga4ValidationFailed = ga4ValidationFailedProps.size;

    const finalStatus =
      totals.gscFailedDates > 0 || totals.ga4FailedDates > 0 ? "partial" : "complete";

    const [finalJob] = await db
      .update(metricsBackfillJobs)
      .set({
        status: finalStatus,
        totals,
        finishedAt: new Date(),
        claimExpiresAt: null,
      })
      .where(
        and(
          eq(metricsBackfillJobs.id, job.id),
          eq(metricsBackfillJobs.status, "processing"),
          eq(metricsBackfillJobs.claimedBy, ownerId),
        ),
      )
      .returning();
    if (!finalJob) throw new Error("Metrics backfill job lease was lost");

    await db.insert(systemLogs).values({
      id: `log_${nanoid(12)}`,
      action: "metrics_sync",
      triggeredBy: job.triggeredByUserId,
      targetUserId: job.targetUserId ?? null,
      status: finalStatus === "complete" ? "success" : "failed",
      details: {
        jobId: job.id,
        reason: job.reason,
        includeGsc: job.includeGsc,
        includeGa4: job.includeGa4,
        dateStart: job.dateStart,
        dateEnd: job.dateEnd,
        totals,
      },
    });

    return { jobId: job.id, status: finalStatus, totals };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Metrics backfill failed";
    await db
      .update(metricsBackfillJobs)
      .set({
        status: "failed",
        error: message,
        totals,
        finishedAt: new Date(),
        claimExpiresAt: null,
      })
      .where(
        and(
          eq(metricsBackfillJobs.id, job.id),
          eq(metricsBackfillJobs.status, "processing"),
          eq(metricsBackfillJobs.claimedBy, ownerId),
        ),
      );
    throw error;
  }
}

async function getMetricsBackfillAuthClient(job: MetricsBackfillJob) {
  const userId = job.targetUserId ?? job.triggeredByUserId;
  const googleAccount = await getGoogleAccountTokensForUser(userId);
  if (googleAccount?.accessToken) {
    return getGoogleAuthClient(
      googleAccount.accessToken,
      googleAccount.refreshToken ?? undefined,
      googleAccount.accessTokenExpiresAt ?? null,
    );
  }

  const owner = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, job.teamId), eq(teamMembers.role, "owner")),
  });
  if (!owner) throw new Error("No team owner found for metrics backfill");
  const ownerAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, owner.userId), eq(account.providerId, "google")),
    columns: { id: true },
  });
  if (!ownerAccount) throw new Error("Google account not linked");
  const ownerTokens = await getGoogleAccountTokensForUser(owner.userId);
  if (!ownerTokens?.accessToken) throw new Error("Google account not linked");
  return getGoogleAuthClient(
    ownerTokens.accessToken,
    ownerTokens.refreshToken ?? undefined,
    ownerTokens.accessTokenExpiresAt ?? null,
  );
}

export async function runSingleMetricsBackfillWorkerTick(workerId = `mbw_${nanoid(8)}`) {
  const job = await claimNextMetricsBackfillJob(workerId);
  if (!job) return { processed: false as const };

  let heartbeatTimer: NodeJS.Timeout | null = null;
  try {
    heartbeatTimer = setInterval(() => {
      void heartbeatMetricsBackfillJob(job.id, workerId);
    }, 10_000);
    const authClient = await getMetricsBackfillAuthClient(job);
    await processMetricsBackfillJob({ jobId: job.id, authClient, workerId });
    return { processed: true as const, jobId: job.id };
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}

export function startMetricsBackfillWorkerLoop(input: {
  intervalMs?: number;
  maxPollMs?: number;
} = {}) {
  let stopped = false;
  let isRunning = false;
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  const workerId = `mbw_${nanoid(8)}`;
  const intervalMs = input.intervalMs ?? parseInt(process.env.METRICS_BACKFILL_WORKER_POLL_MS ?? "4000", 10);
  const maxPollMs = input.maxPollMs ?? parseInt(process.env.METRICS_BACKFILL_WORKER_MAX_POLL_MS ?? "30000", 10);
  let idleCount = 0;

  const loop = async () => {
    if (stopped || isRunning) return;
    isRunning = true;
    let processed = false;
    try {
      const result = await runSingleMetricsBackfillWorkerTick(workerId);
      processed = result.processed;
      if (processed) {
        console.log(`[metrics-backfill][INFO] processed job worker=${workerId} job=${result.jobId}`);
      }
    } catch (error) {
      console.error("[metrics-backfill][ERROR] worker loop error", error);
    } finally {
      isRunning = false;
      if (!stopped) {
        const delay = Math.min(intervalMs * Math.pow(2, idleCount), maxPollMs);
        idleCount = processed ? 0 : idleCount + 1;
        pendingTimeout = setTimeout(loop, delay);
      }
    }
  };

  console.log(`[metrics-backfill][INFO] loop started worker=${workerId} pollMs=${intervalMs} maxPollMs=${maxPollMs}`);
  void loop();

  return {
    stop() {
      stopped = true;
      if (pendingTimeout) clearTimeout(pendingTimeout);
    },
  };
}

export async function getLatestMetricsBackfillState(params: {
  teamId: string;
  propertyId: string;
}) {
  const row = await db.query.metricsBackfillJobs.findFirst({
    where: and(
      eq(metricsBackfillJobs.teamId, params.teamId),
      eq(metricsBackfillJobs.targetPropertyId, params.propertyId),
    ),
    orderBy: (table, { desc: descOrder, sql: sqlOrder }) => [
      sqlOrder<number>`case when ${table.status} in ('queued', 'processing') then 0 else 1 end`,
      descOrder(table.createdAt),
    ],
  });
  if (!row) return null;
  return {
    id: row.id,
    jobType: "metrics_refresh" as const,
    status: row.status as "queued" | "processing" | "complete" | "failed" | "partial",
    phase: row.status === "queued" ? "source_data_queued" : row.status === "processing" ? "source_data" : "done",
    message: row.status === "queued"
      ? "Source data refresh queued"
      : row.status === "processing"
        ? "Refreshing GA4 and Search Console data..."
        : row.status === "partial"
          ? "Source data refresh partially complete"
          : row.status === "failed"
            ? "Source data refresh failed"
            : "Source data refresh complete",
    progressMeta: row.totals as Record<string, unknown> | null,
    startedAt: row.startedAt?.toISOString() ?? null,
    finishedAt: row.finishedAt?.toISOString() ?? null,
    updatedAt: (row.finishedAt ?? row.startedAt ?? row.createdAt).toISOString(),
  };
}

function collectDateSet(rows: Array<{ sourceDate: string | Date }>) {
  return new Set(rows.map((r) => normalizeDateStr(r.sourceDate)));
}

function uniqueDateStrings(values: string[]) {
  return [...new Set(values)].sort();
}

export async function getPropertyMetricsCoverage(params: {
  property: PropertyRecord;
  dateStart: DateString;
  dateEnd: DateString;
  refreshRecentDays?: number;
}) {
  assertMetricsRefreshWindow({ dateStart: params.dateStart, dateEnd: params.dateEnd });
  const refreshRecentDays = params.refreshRecentDays ?? 7;
  const requiredDates = eachDateInRange(params.dateStart, params.dateEnd);

  const [gscFactRows, gscRawRows] = await Promise.all([
    db.query.gscDailyFacts.findMany({
      where: (t, { and, eq, gte, lte }) =>
        and(eq(t.propertyId, params.property.id), gte(t.sourceDate, params.dateStart), lte(t.sourceDate, params.dateEnd)),
      columns: { sourceDate: true },
    }),
    db.query.gscDailyRaw.findMany({
      where: (t, { and, eq, gte, lte }) =>
        and(eq(t.propertyId, params.property.id), gte(t.sourceDate, params.dateStart), lte(t.sourceDate, params.dateEnd)),
      columns: { sourceDate: true },
    }),
  ]);

  const gscFactSet = collectDateSet(gscFactRows);
  const gscRawSet = collectDateSet(gscRawRows);

  const missingGscDates: string[] = [];
  for (const d of requiredDates) {
    if (!gscFactSet.has(d) || !gscRawSet.has(d)) missingGscDates.push(d);
  }

  let missingGa4Dates: string[] = [];
  if (params.property.ga4PropertyId) {
    const [ga4FactRows, ga4RawRows] = await Promise.all([
      db.query.ga4DailyFacts.findMany({
        where: (t, { and, eq, gte, lte }) =>
          and(eq(t.ga4PropertyId, params.property.ga4PropertyId!), gte(t.sourceDate, params.dateStart), lte(t.sourceDate, params.dateEnd)),
        columns: { sourceDate: true },
      }),
      db.query.ga4DailyRaw.findMany({
        where: (t, { and, eq, gte, lte }) =>
          and(eq(t.ga4PropertyId, params.property.ga4PropertyId!), gte(t.sourceDate, params.dateStart), lte(t.sourceDate, params.dateEnd)),
        columns: { sourceDate: true },
      }),
    ]);
    const ga4FactSet = collectDateSet(ga4FactRows);
    const ga4RawSet = collectDateSet(ga4RawRows);
    missingGa4Dates = requiredDates.filter((d) => !ga4FactSet.has(d) || !ga4RawSet.has(d));
  }

  const staleDates = requiredDates.filter((d) => isWithinFreshWindow(d, refreshRecentDays));
  return {
    requiredDates,
    staleDates,
    missingGscDates: uniqueDateStrings(missingGscDates),
    missingGa4Dates: uniqueDateStrings(missingGa4Dates),
    gscComplete: missingGscDates.length === 0,
    ga4Complete: params.property.ga4PropertyId ? missingGa4Dates.length === 0 : true,
    complete: missingGscDates.length === 0 && (!params.property.ga4PropertyId || missingGa4Dates.length === 0),
  };
}

type AggregatedGscTopQuery = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type AggregatedGscTopPage = {
  page: string;
  clicks: number;
  impressions: number;
};

type AggregatedGscQueryPagePair = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type AggregatedGscTopCountry = {
  country: string;
  clicks: number;
  impressions: number;
};

type AggregatedGscTopDevice = {
  device: string;
  clicks: number;
  impressions: number;
};

function aggregateGscTopQueries(rawRows: Array<typeof gscDailyRaw.$inferSelect>): AggregatedGscTopQuery[] {
  const map = new Map<string, { clicks: number; impressions: number; positionImpr: number }>();
  for (const row of rawRows) {
    const items = Array.isArray(row.queriesPayload) ? (row.queriesPayload as unknown[]) : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const key = String(record.query ?? "");
      if (!key) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const position = Number(record.position ?? 0);
      const cur = map.get(key) ?? { clicks: 0, impressions: 0, positionImpr: 0 };
      cur.clicks += clicks;
      cur.impressions += impressions;
      cur.positionImpr += position * Math.max(impressions, 1);
      map.set(key, cur);
    }
  }

  return [...map.entries()]
    .map(([query, v]) => ({
      query,
      clicks: v.clicks,
      impressions: v.impressions,
      ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
      position: v.impressions > 0 ? v.positionImpr / v.impressions : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 25);
}

function aggregateGscTopPages(rawRows: Array<typeof gscDailyRaw.$inferSelect>): AggregatedGscTopPage[] {
  const map = new Map<string, { clicks: number; impressions: number }>();
  for (const row of rawRows) {
    const items = Array.isArray(row.pagesPayload) ? (row.pagesPayload as unknown[]) : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const key = String(record.page ?? "");
      if (!key) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const cur = map.get(key) ?? { clicks: 0, impressions: 0 };
      cur.clicks += clicks;
      cur.impressions += impressions;
      map.set(key, cur);
    }
  }

  return [...map.entries()]
    .map(([page, v]) => ({ page, clicks: v.clicks, impressions: v.impressions }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 25);
}

function aggregateGscQueryPagePairs(rawRows: Array<typeof gscDailyRaw.$inferSelect>): AggregatedGscQueryPagePair[] {
  const map = new Map<string, { clicks: number; impressions: number; positionImpr: number }>();
  for (const row of rawRows) {
    const items = Array.isArray(row.queryPagePairsPayload) ? (row.queryPagePairsPayload as unknown[]) : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const query = String(record.query ?? "");
      const page = String(record.page ?? "");
      if (!query || !page) continue;
      const key = `${query}\u0000${page}`;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const position = Number(record.position ?? 0);
      const cur = map.get(key) ?? { clicks: 0, impressions: 0, positionImpr: 0 };
      cur.clicks += clicks;
      cur.impressions += impressions;
      cur.positionImpr += position * Math.max(impressions, 1);
      map.set(key, cur);
    }
  }

  return [...map.entries()]
    .map(([key, v]) => {
      const [query = "", page = ""] = key.split("\u0000");
      return {
        query,
        page,
        clicks: v.clicks,
        impressions: v.impressions,
        ctr: v.impressions > 0 ? v.clicks / v.impressions : 0,
        position: v.impressions > 0 ? v.positionImpr / v.impressions : 0,
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 25);
}

function aggregateGscTopCountries(rawRows: Array<typeof gscDailyRaw.$inferSelect>): AggregatedGscTopCountry[] {
  const map = new Map<string, { clicks: number; impressions: number }>();
  for (const row of rawRows) {
    const items = Array.isArray(row.countriesPayload) ? (row.countriesPayload as unknown[]) : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const key = String(record.country ?? "");
      if (!key) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const cur = map.get(key) ?? { clicks: 0, impressions: 0 };
      cur.clicks += clicks;
      cur.impressions += impressions;
      map.set(key, cur);
    }
  }

  return [...map.entries()]
    .map(([country, v]) => ({ country, clicks: v.clicks, impressions: v.impressions }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 25);
}

function aggregateGscTopDevices(rawRows: Array<typeof gscDailyRaw.$inferSelect>): AggregatedGscTopDevice[] {
  const map = new Map<string, { clicks: number; impressions: number }>();
  for (const row of rawRows) {
    const items = Array.isArray(row.devicesPayload) ? (row.devicesPayload as unknown[]) : [];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const key = String(record.device ?? "");
      if (!key) continue;
      const clicks = Number(record.clicks ?? 0);
      const impressions = Number(record.impressions ?? 0);
      const cur = map.get(key) ?? { clicks: 0, impressions: 0 };
      cur.clicks += clicks;
      cur.impressions += impressions;
      map.set(key, cur);
    }
  }

  return [...map.entries()]
    .map(([device, v]) => ({ device, clicks: v.clicks, impressions: v.impressions }))
    .sort((a, b) => b.clicks - a.clicks);
}

function aggregateGscSummary(factRows: Array<typeof gscDailyFacts.$inferSelect>) {
  const clicks = factRows.reduce((sum, r) => sum + r.clicks, 0);
  const impressions = factRows.reduce((sum, r) => sum + r.impressions, 0);
  const positionWeighted = factRows.reduce(
    (sum, r) => sum + parseFactNumber(r.position) * Math.max(r.impressions, 1),
    0,
  );
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? positionWeighted / impressions : 0,
  };
}

function aggregateGa4Summary(factRows: Array<typeof ga4DailyFacts.$inferSelect>) {
  return {
    sessions: factRows.reduce((sum, r) => sum + r.sessions, 0),
    users: factRows.reduce((sum, r) => sum + r.users, 0),
    newUsers: factRows.reduce((sum, r) => sum + (r.newUsers ?? 0), 0),
  };
}

async function loadGscRange(propertyId: string, start: DateString, end: DateString) {
  const [factRows, rawRows] = await Promise.all([
    db.query.gscDailyFacts.findMany({
      where: (t, { and, eq, gte, lte }) => and(eq(t.propertyId, propertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
      orderBy: (t, { asc }) => [asc(t.sourceDate)],
    }),
    db.query.gscDailyRaw.findMany({
      where: (t, { and, eq, gte, lte }) => and(eq(t.propertyId, propertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
      orderBy: (t, { asc }) => [asc(t.sourceDate)],
    }),
  ]);
  return { factRows, rawRows };
}

async function loadGa4Range(ga4PropertyId: string, start: DateString, end: DateString) {
  const factRows = await db.query.ga4DailyFacts.findMany({
    where: (t, { and, eq, gte, lte }) => and(eq(t.ga4PropertyId, ga4PropertyId), gte(t.sourceDate, start), lte(t.sourceDate, end)),
    orderBy: (t, { asc }) => [asc(t.sourceDate)],
  });
  return { factRows };
}

export async function composeReportMetricsFromCache(params: {
  property: PropertyRecord;
  dateRangeStart: DateString;
  dateRangeEnd: DateString;
  compareRangeStart: DateString;
  compareRangeEnd: DateString;
  refreshRecentDays?: number;
}) {
  if (params.property.type !== "gsc" && !params.property.id.startsWith("gsc_")) {
    throw new Error(`composeReportMetricsFromCache requires a GSC property; received ${params.property.id}`);
  }

  const refreshRecentDays = params.refreshRecentDays ?? 7;
  const currentCoverage = await getPropertyMetricsCoverage({
    property: params.property,
    dateStart: params.dateRangeStart,
    dateEnd: params.dateRangeEnd,
    refreshRecentDays,
  });
  const compareCoverage = await getPropertyMetricsCoverage({
    property: params.property,
    dateStart: params.compareRangeStart,
    dateEnd: params.compareRangeEnd,
    refreshRecentDays,
  });

  if (!currentCoverage.complete || !compareCoverage.complete) {
    return null;
  }

  const [gscCurrent, gscCompare] = await Promise.all([
    loadGscRange(params.property.id, params.dateRangeStart, params.dateRangeEnd),
    loadGscRange(params.property.id, params.compareRangeStart, params.compareRangeEnd),
  ]);

  if (
    gscCurrent.factRows.length !== eachDateInRange(params.dateRangeStart, params.dateRangeEnd).length ||
    gscCompare.factRows.length !== eachDateInRange(params.compareRangeStart, params.compareRangeEnd).length
  ) {
    return null;
  }

  const gscCurrentSummary = aggregateGscSummary(gscCurrent.factRows);
  const gscCompareSummary = aggregateGscSummary(gscCompare.factRows);

  let ga4Current: { sessions: number; users: number; newUsers: number } | null = null;
  let ga4Compare: { sessions: number; users: number; newUsers: number } | null = null;

  if (params.property.ga4PropertyId) {
    const [ga4CurRows, ga4CmpRows] = await Promise.all([
      loadGa4Range(params.property.ga4PropertyId, params.dateRangeStart, params.dateRangeEnd),
      loadGa4Range(params.property.ga4PropertyId, params.compareRangeStart, params.compareRangeEnd),
    ]);
    ga4Current = aggregateGa4Summary(ga4CurRows.factRows);
    ga4Compare = aggregateGa4Summary(ga4CmpRows.factRows);
  }

  return {
    gsc: {
      current: {
        ...gscCurrentSummary,
        topQueries: aggregateGscTopQueries(gscCurrent.rawRows),
        topPages: aggregateGscTopPages(gscCurrent.rawRows),
        queryPagePairs: aggregateGscQueryPagePairs(gscCurrent.rawRows),
        topCountries: aggregateGscTopCountries(gscCurrent.rawRows),
        topDevices: aggregateGscTopDevices(gscCurrent.rawRows),
      },
      compare: {
        ...gscCompareSummary,
        topQueries: aggregateGscTopQueries(gscCompare.rawRows),
        topPages: aggregateGscTopPages(gscCompare.rawRows),
        queryPagePairs: aggregateGscQueryPagePairs(gscCompare.rawRows),
        topCountries: aggregateGscTopCountries(gscCompare.rawRows),
        topDevices: aggregateGscTopDevices(gscCompare.rawRows),
      },
    },
    ga4: {
      current: ga4Current,
      compare: ga4Compare,
    },
  };
}

export async function ensureMetricsCoverageForReport(params: {
  teamId: string;
  triggeredByUserId: string;
  property: PropertyRecord;
  dateRangeStart: DateString;
  dateRangeEnd: DateString;
  compareRangeStart: DateString;
  compareRangeEnd: DateString;
  authClient: unknown;
  refreshRecentDays?: number;
}) {
  if (params.property.type !== "gsc" && !params.property.id.startsWith("gsc_")) {
    throw new Error(`ensureMetricsCoverageForReport requires a GSC property; received ${params.property.id}`);
  }

  const refreshRecentDays = params.refreshRecentDays ?? 7;
  const currentWindow: MetricsRefreshWindow = assertMetricsRefreshWindow({
    dateStart: params.dateRangeStart,
    dateEnd: params.dateRangeEnd,
  });
  const compareWindow: MetricsRefreshWindow = assertMetricsRefreshWindow({
    dateStart: params.compareRangeStart,
    dateEnd: params.compareRangeEnd,
  });
  const [currentCoverage, compareCoverage] = await Promise.all([
    getPropertyMetricsCoverage({
      property: params.property,
      dateStart: currentWindow.dateStart,
      dateEnd: currentWindow.dateEnd,
      refreshRecentDays,
    }),
    getPropertyMetricsCoverage({
      property: params.property,
      dateStart: compareWindow.dateStart,
      dateEnd: compareWindow.dateEnd,
      refreshRecentDays,
    }),
  ]);

  if (currentCoverage.complete && compareCoverage.complete) {
    return { needed: false as const, jobId: null, result: null };
  }

  const windowsToRefresh = [
    currentCoverage.complete ? null : currentWindow,
    compareCoverage.complete ? null : compareWindow,
  ].filter((window): window is MetricsRefreshWindow => Boolean(window));

  const jobs = [];
  const results = [];
  for (const window of windowsToRefresh) {
    const job = await createMetricsBackfillJob({
      teamId: params.teamId,
      triggeredByUserId: params.triggeredByUserId,
      targetPropertyId: params.property.id,
      includeGsc: true,
      includeGa4: !!params.property.ga4PropertyId,
      dateStart: window.dateStart,
      dateEnd: window.dateEnd,
      reason: "report_preflight",
      timeframeMode: "custom",
      refreshRecentDays,
    });
    jobs.push(job);
    results.push(await processMetricsBackfillJob({ jobId: job.id, authClient: params.authClient }));
  }
  return { needed: true as const, jobId: jobs[0]?.id ?? null, result: results[0] ?? null, jobIds: jobs.map((job) => job.id), results };
}

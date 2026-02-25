import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import {
  ga4DailyFacts,
  ga4DailyRaw,
  gscDailyFacts,
  gscDailyRaw,
  metricsBackfillJobs,
  properties,
  systemLogs,
} from "@/db/schema";
import {
  fetchGa4DailySummary,
  fetchGscMetricsBatch,
  type GscDayMetrics,
} from "@/lib/google/api";

type DateString = string;

type PropertyRecord = typeof properties.$inferSelect;
type MetricsBackfillJob = typeof metricsBackfillJobs.$inferSelect;

export type MetricsBackfillReason = "admin_sync" | "report_preflight" | "manual_backfill";

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
  const a = new Date(`${start}T00:00:00.000Z`).getTime();
  const b = new Date(`${end}T00:00:00.000Z`).getTime();
  return Math.floor((b - a) / (1000 * 60 * 60 * 24)) + 1;
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

export async function createMetricsBackfillJob(input: CreateMetricsBackfillJobInput) {
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
      status: "queued",
    })
    .returning();
  return job;
}

async function getGscPropertiesForJob(job: MetricsBackfillJob) {
  if (job.targetPropertyId) {
    return db.query.properties.findMany({
      where: (p, { and, eq }) =>
        and(eq(p.teamId, job.teamId), eq(p.id, job.targetPropertyId!), eq(p.type, "gsc")),
    });
  }

  return db.query.properties.findMany({
    where: (p, { and, eq }) => and(eq(p.teamId, job.teamId), eq(p.type, "gsc")),
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
}) {
  const job = await db.query.metricsBackfillJobs.findFirst({
    where: (j, { eq }) => eq(j.id, args.jobId),
  });
  if (!job) throw new Error("Metrics backfill job not found");

  const totals = ZERO_TOTALS();
  const gscValidatedProps = new Set<string>();
  const gscValidationFailedProps = new Set<string>();
  const ga4ValidatedProps = new Set<string>();
  const ga4ValidationFailedProps = new Set<string>();

  await db
    .update(metricsBackfillJobs)
    .set({ status: "processing", startedAt: new Date(), error: null })
    .where(eq(metricsBackfillJobs.id, job.id));

  const dateStart = String(job.dateStart);
  const dateEnd = String(job.dateEnd);
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
                  topQueries: [], topPages: [], topCountries: [], topDevices: [],
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
          const dayMap = await fetchGa4DailySummary(args.authClient, ga4Id, fetchStart, fetchEnd);

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

    await db
      .update(metricsBackfillJobs)
      .set({
        status: finalStatus,
        totals,
        finishedAt: new Date(),
      })
      .where(eq(metricsBackfillJobs.id, job.id));

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
      })
      .where(eq(metricsBackfillJobs.id, job.id));
    throw error;
  }
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
        topCountries: aggregateGscTopCountries(gscCurrent.rawRows),
        topDevices: aggregateGscTopDevices(gscCurrent.rawRows),
      },
      compare: {
        ...gscCompareSummary,
        topQueries: aggregateGscTopQueries(gscCompare.rawRows),
        topPages: aggregateGscTopPages(gscCompare.rawRows),
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
  const refreshRecentDays = params.refreshRecentDays ?? 7;
  const allDates = [
    ...eachDateInRange(params.dateRangeStart, params.dateRangeEnd),
    ...eachDateInRange(params.compareRangeStart, params.compareRangeEnd),
  ].sort();
  const dateStart = allDates[0];
  const dateEnd = allDates[allDates.length - 1];

  const [currentCoverage, compareCoverage] = await Promise.all([
    getPropertyMetricsCoverage({
      property: params.property,
      dateStart: params.dateRangeStart,
      dateEnd: params.dateRangeEnd,
      refreshRecentDays,
    }),
    getPropertyMetricsCoverage({
      property: params.property,
      dateStart: params.compareRangeStart,
      dateEnd: params.compareRangeEnd,
      refreshRecentDays,
    }),
  ]);

  if (currentCoverage.complete && compareCoverage.complete) {
    return { needed: false as const, jobId: null, result: null };
  }

  const job = await createMetricsBackfillJob({
    teamId: params.teamId,
    triggeredByUserId: params.triggeredByUserId,
    targetPropertyId: params.property.id,
    includeGsc: true,
    includeGa4: !!params.property.ga4PropertyId,
    dateStart,
    dateEnd,
    reason: "report_preflight",
    timeframeMode: "custom",
    refreshRecentDays,
  });
  const result = await processMetricsBackfillJob({ jobId: job.id, authClient: params.authClient });
  return { needed: true as const, jobId: job.id, result };
}

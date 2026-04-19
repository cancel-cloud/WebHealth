import { and, count, eq, gte, max } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db";
import {
  gscDailyFacts,
  propertyWeeklyReviews,
  reports,
  weeklyReviewRuns,
} from "../db/schema";
import { recordProductEvent } from "./product-event-store";
import {
  buildWeeklyReviewRunKey,
  getWeeklyReviewWindow,
  shouldRunWeeklyScheduler,
  type WeeklyReviewWindow,
} from "./weekly-review";
import { enqueueReportJob } from "./queue/report-jobs";

export type WeeklyReviewSchedulerControls = {
  stop: () => void;
};

export function startWeeklyReviewScheduler(input: {
  timeZone?: string;
  intervalMs?: number;
} = {}): WeeklyReviewSchedulerControls {
  const timeZone = input.timeZone ?? process.env.WEEKLY_REVIEW_TIMEZONE ?? "Europe/Berlin";
  const intervalMs = input.intervalMs ?? Number(process.env.WEEKLY_REVIEW_SCHEDULER_INTERVAL_MS ?? 60 * 60 * 1000);

  const runIfDue = () => {
    if (!shouldRunWeeklyScheduler(new Date(), timeZone)) return;
    void enqueueWeeklyReviewReports({ timeZone }).catch((error) => {
      console.error("[weekly-review] scheduler failed", error);
    });
  };

  runIfDue();
  const timer = setInterval(runIfDue, intervalMs);
  return {
    stop: () => clearInterval(timer),
  };
}

export async function enqueueWeeklyReviewReports(input: {
  now?: Date;
  timeZone?: string;
} = {}) {
  const watched = await db.query.propertyWeeklyReviews.findMany({
    where: (review, { eq }) => eq(review.enabled, true),
  });

  let enqueued = 0;
  let skipped = 0;

  for (const watch of watched) {
    const property = await db.query.properties.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.id, watch.propertyId), eq(p.teamId, watch.teamId), eq(p.type, "gsc")),
    });
    if (!property) continue;

    const latestDate = await getLatestGscDate(watch.teamId, watch.propertyId);
    if (!latestDate) {
      await createSkippedRun({
        teamId: watch.teamId,
        propertyId: watch.propertyId,
        window: fallbackWindow(input.now ?? new Date()),
        runKeySuffix: "no-data",
        skipReason: "no_data",
      });
      skipped += 1;
      continue;
    }

    const window = getWeeklyReviewWindow(latestDate);
    const runKey = buildWeeklyReviewRunKey({
      teamId: watch.teamId,
      propertyId: watch.propertyId,
      dateRangeStart: window.dateRangeStart,
      dateRangeEnd: window.dateRangeEnd,
    });
    const existing = await db.query.weeklyReviewRuns.findFirst({
      where: (run, { and, eq }) =>
        and(eq(run.teamId, watch.teamId), eq(run.propertyId, watch.propertyId), eq(run.runKey, runKey)),
      columns: { id: true },
    });
    if (existing) continue;

    const quota = await getMonthlyReportQuota(watch.teamId, input.now ?? new Date());
    if (quota.limit !== null && quota.used >= quota.limit) {
      await createSkippedRun({
        teamId: watch.teamId,
        propertyId: watch.propertyId,
        window,
        runKey,
        skipReason: "quota",
      });
      await recordProductEvent({
        teamId: watch.teamId,
        userId: watch.createdByUserId,
        name: "weekly_auto_report_skipped_quota",
        source: "worker",
        entityType: "property",
        entityId: watch.propertyId,
        properties: { propertyId: watch.propertyId, limit: quota.limit, used: quota.used },
      });
      skipped += 1;
      continue;
    }

    const reportId = `rep_${nanoid(12)}`;
    const [run] = await db.transaction(async (tx) => {
      const [createdRun] = await tx
        .insert(weeklyReviewRuns)
        .values({
          id: `wrr_${nanoid(12)}`,
          teamId: watch.teamId,
          propertyId: watch.propertyId,
          runKey,
          status: "queued",
          dateRangeStart: window.dateRangeStart,
          dateRangeEnd: window.dateRangeEnd,
          compareRangeStart: window.compareRangeStart,
          compareRangeEnd: window.compareRangeEnd,
        })
        .onConflictDoNothing()
        .returning();
      if (!createdRun) return [];

      const [report] = await tx
        .insert(reports)
        .values({
          id: reportId,
          teamId: watch.teamId,
          propertyId: watch.propertyId,
          dateRangeStart: window.dateRangeStart,
          dateRangeEnd: window.dateRangeEnd,
          compareRangeStart: window.compareRangeStart,
          compareRangeEnd: window.compareRangeEnd,
          status: "queued",
          source: "auto_weekly",
          autoRunKey: runKey,
          aiStatus: "queued",
          xlsxStatus: "pending",
        })
        .returning({ id: reports.id });

      await tx
        .update(weeklyReviewRuns)
        .set({ reportId: report.id, updatedAt: new Date() })
        .where(eq(weeklyReviewRuns.id, createdRun.id));
      await tx
        .update(propertyWeeklyReviews)
        .set({ lastRunAt: new Date(), updatedAt: new Date() })
        .where(eq(propertyWeeklyReviews.id, watch.id));

      return [createdRun];
    });

    if (!run) continue;

    await enqueueReportJob({
      reportId,
      teamId: watch.teamId,
      kind: "generate_report",
      priority: quota.tier === "pro" || quota.tier === "agency" ? 50 : 100,
      payload: {
        runXlsx: true,
        source: "auto_weekly",
        skipOpenAi: true,
        weeklyRunId: run.id,
      },
    });
    await recordProductEvent({
      teamId: watch.teamId,
      userId: watch.createdByUserId,
      name: "weekly_auto_report_enqueued",
      source: "worker",
      entityType: "report",
      entityId: reportId,
      properties: {
        propertyId: watch.propertyId,
        dateRangeStart: window.dateRangeStart,
        dateRangeEnd: window.dateRangeEnd,
      },
    });
    enqueued += 1;
  }

  return { enqueued, skipped };
}

async function getLatestGscDate(teamId: string, propertyId: string) {
  const [row] = await db
    .select({ latest: max(gscDailyFacts.sourceDate) })
    .from(gscDailyFacts)
    .where(and(eq(gscDailyFacts.teamId, teamId), eq(gscDailyFacts.propertyId, propertyId)));

  return row?.latest ? formatDateOnly(row.latest) : null;
}

async function getMonthlyReportQuota(teamId: string, now: Date) {
  const team = await db.query.teams.findFirst({
    where: (t, { eq }) => eq(t.id, teamId),
    columns: { tier: true },
  });
  const tier = team?.tier ?? "free";
  const plan = await db.query.planSettings.findFirst({
    where: (settings, { eq }) => eq(settings.tier, tier),
    columns: { reportsPerMonth: true },
  });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [row] = await db
    .select({ used: count(reports.id) })
    .from(reports)
    .where(and(eq(reports.teamId, teamId), gte(reports.createdAt, monthStart)));

  return {
    tier,
    limit: plan?.reportsPerMonth ?? null,
    used: row?.used ?? 0,
  };
}

async function createSkippedRun(input: {
  teamId: string;
  propertyId: string;
  window: WeeklyReviewWindow;
  runKey?: string;
  runKeySuffix?: string;
  skipReason: string;
}) {
  const runKey =
    input.runKey ??
    buildWeeklyReviewRunKey({
      teamId: input.teamId,
      propertyId: input.propertyId,
      dateRangeStart: input.window.dateRangeStart,
      dateRangeEnd: `${input.window.dateRangeEnd}:${input.runKeySuffix ?? input.skipReason}`,
    });

  await db
    .insert(weeklyReviewRuns)
    .values({
      id: `wrr_${nanoid(12)}`,
      teamId: input.teamId,
      propertyId: input.propertyId,
      runKey,
      status: "skipped",
      skipReason: input.skipReason,
      dateRangeStart: input.window.dateRangeStart,
      dateRangeEnd: input.window.dateRangeEnd,
      compareRangeStart: input.window.compareRangeStart,
      compareRangeEnd: input.window.compareRangeEnd,
      completedAt: new Date(),
    })
    .onConflictDoNothing();
}

function fallbackWindow(now: Date): WeeklyReviewWindow {
  return getWeeklyReviewWindow(formatDateOnly(now));
}

function formatDateOnly(value: string | Date) {
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
}

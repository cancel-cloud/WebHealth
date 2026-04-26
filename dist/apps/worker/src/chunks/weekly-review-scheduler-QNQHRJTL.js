import {
  buildWeeklyReviewRunKey,
  enqueueReportJob,
  getWeeklyReviewWindow,
  recordProductEvent,
  shouldRunWeeklyScheduler
} from "./chunk-WLWOQ7DG.js";
import {
  db
} from "./chunk-DG7CE5Z4.js";
import {
  gscDailyFacts,
  propertyWeeklyReviews,
  reports,
  weeklyReviewRuns
} from "./chunk-NLKMMEGJ.js";
import "./chunk-AHMZJEDT.js";
import "./chunk-3LHI6BO3.js";

// packages/shared/src/lib/weekly-review-scheduler.ts
import { and, count, eq, gte, max } from "drizzle-orm";
import { nanoid } from "nanoid";
function startWeeklyReviewScheduler(input = {}) {
  const timeZone = input.timeZone ?? process.env.WEEKLY_REVIEW_TIMEZONE ?? "Europe/Berlin";
  const intervalMs = input.intervalMs ?? Number(process.env.WEEKLY_REVIEW_SCHEDULER_INTERVAL_MS ?? 60 * 60 * 1e3);
  const runIfDue = () => {
    if (!shouldRunWeeklyScheduler(/* @__PURE__ */ new Date(), timeZone)) return;
    void enqueueWeeklyReviewReports({ timeZone }).catch((error) => {
      console.error("[weekly-review] scheduler failed", error);
    });
  };
  runIfDue();
  const timer = setInterval(runIfDue, intervalMs);
  return {
    stop: () => clearInterval(timer)
  };
}
async function enqueueWeeklyReviewReports(input = {}) {
  const watched = await db.query.propertyWeeklyReviews.findMany({
    where: (review, { eq: eq2 }) => eq2(review.enabled, true)
  });
  let enqueued = 0;
  let skipped = 0;
  for (const watch of watched) {
    const property = await db.query.properties.findFirst({
      where: (p, { and: and2, eq: eq2 }) => and2(eq2(p.id, watch.propertyId), eq2(p.teamId, watch.teamId), eq2(p.type, "gsc"), eq2(p.active, true))
    });
    if (!property) continue;
    const latestDate = await getLatestGscDate(watch.teamId, watch.propertyId);
    if (!latestDate) {
      await createSkippedRun({
        teamId: watch.teamId,
        propertyId: watch.propertyId,
        window: fallbackWindow(input.now ?? /* @__PURE__ */ new Date()),
        runKeySuffix: "no-data",
        skipReason: "no_data"
      });
      skipped += 1;
      continue;
    }
    const window = getWeeklyReviewWindow(latestDate);
    const runKey = buildWeeklyReviewRunKey({
      teamId: watch.teamId,
      propertyId: watch.propertyId,
      dateRangeStart: window.dateRangeStart,
      dateRangeEnd: window.dateRangeEnd
    });
    const existing = await db.query.weeklyReviewRuns.findFirst({
      where: (run2, { and: and2, eq: eq2 }) => and2(eq2(run2.teamId, watch.teamId), eq2(run2.propertyId, watch.propertyId), eq2(run2.runKey, runKey)),
      columns: { id: true }
    });
    if (existing) continue;
    const quota = await getMonthlyReportQuota(watch.teamId, input.now ?? /* @__PURE__ */ new Date());
    if (quota.limit !== null && quota.used >= quota.limit) {
      await createSkippedRun({
        teamId: watch.teamId,
        propertyId: watch.propertyId,
        window,
        runKey,
        skipReason: "quota"
      });
      await recordProductEvent({
        teamId: watch.teamId,
        userId: watch.createdByUserId,
        name: "weekly_auto_report_skipped_quota",
        source: "worker",
        entityType: "property",
        entityId: watch.propertyId,
        properties: { propertyId: watch.propertyId, limit: quota.limit, used: quota.used }
      });
      skipped += 1;
      continue;
    }
    const reportId = `rep_${nanoid(12)}`;
    const [run] = await db.transaction(async (tx) => {
      const [createdRun] = await tx.insert(weeklyReviewRuns).values({
        id: `wrr_${nanoid(12)}`,
        teamId: watch.teamId,
        propertyId: watch.propertyId,
        runKey,
        status: "queued",
        dateRangeStart: window.dateRangeStart,
        dateRangeEnd: window.dateRangeEnd,
        compareRangeStart: window.compareRangeStart,
        compareRangeEnd: window.compareRangeEnd
      }).onConflictDoNothing().returning();
      if (!createdRun) return [];
      const [report] = await tx.insert(reports).values({
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
        xlsxStatus: "pending"
      }).returning({ id: reports.id });
      await tx.update(weeklyReviewRuns).set({ reportId: report.id, updatedAt: /* @__PURE__ */ new Date() }).where(eq(weeklyReviewRuns.id, createdRun.id));
      await tx.update(propertyWeeklyReviews).set({ lastRunAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(propertyWeeklyReviews.id, watch.id));
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
        weeklyRunId: run.id
      }
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
        dateRangeEnd: window.dateRangeEnd
      }
    });
    enqueued += 1;
  }
  return { enqueued, skipped };
}
async function getLatestGscDate(teamId, propertyId) {
  const [row] = await db.select({ latest: max(gscDailyFacts.sourceDate) }).from(gscDailyFacts).where(and(eq(gscDailyFacts.teamId, teamId), eq(gscDailyFacts.propertyId, propertyId)));
  return row?.latest ? formatDateOnly(row.latest) : null;
}
async function getMonthlyReportQuota(teamId, now) {
  const team = await db.query.teams.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, teamId),
    columns: { tier: true }
  });
  const tier = team?.tier ?? "free";
  const plan = await db.query.planSettings.findFirst({
    where: (settings, { eq: eq2 }) => eq2(settings.tier, tier),
    columns: { reportsPerMonth: true }
  });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [row] = await db.select({ used: count(reports.id) }).from(reports).where(and(eq(reports.teamId, teamId), gte(reports.createdAt, monthStart)));
  return {
    tier,
    limit: plan?.reportsPerMonth ?? null,
    used: row?.used ?? 0
  };
}
async function createSkippedRun(input) {
  const runKey = input.runKey ?? buildWeeklyReviewRunKey({
    teamId: input.teamId,
    propertyId: input.propertyId,
    dateRangeStart: input.window.dateRangeStart,
    dateRangeEnd: `${input.window.dateRangeEnd}:${input.runKeySuffix ?? input.skipReason}`
  });
  await db.insert(weeklyReviewRuns).values({
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
    completedAt: /* @__PURE__ */ new Date()
  }).onConflictDoNothing();
}
function fallbackWindow(now) {
  return getWeeklyReviewWindow(formatDateOnly(now));
}
function formatDateOnly(value) {
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
}
export {
  enqueueWeeklyReviewReports,
  startWeeklyReviewScheduler
};

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import {
  account,
  metricsBackfillJobs,
  properties,
  propertyCrawlSnapshots,
  propertyRefreshJobs,
  teamMembers,
} from "@webhealth/shared/db/schema";
import { createMetricsBackfillJob } from "@webhealth/shared/lib/metrics-cache";
import { enqueuePropertyRefreshJob } from "@webhealth/shared/lib/property-refresh";
import {
  buildActivePropertyAutomationPlan,
  getDailyMetricsRefreshWindow,
  type ActiveAutomationProperty,
} from "@webhealth/shared/lib/active-property-automation-policy";

export {
  buildActivePropertyAutomationPlan,
  getDailyMetricsRefreshWindow,
  type ActiveAutomationProperty,
  type ActivePropertyAutomationPlan,
} from "@webhealth/shared/lib/active-property-automation-policy";

async function loadAutomationProperties(): Promise<ActiveAutomationProperty[]> {
  const [rows, teamRows] = await Promise.all([
    db.query.properties.findMany({
      where: (property, { eq: eqFn }) => eqFn(property.active, true),
    }),
    db.query.teams.findMany({
      columns: { id: true, tier: true },
    }),
  ]);
  const tierByTeamId = new Map(teamRows.map((team) => [team.id, team.tier] as const));

  return Promise.all(rows.map(async (property) => {
    const [latestCrawl, refreshJobs, metricsJob] = await Promise.all([
      property.type === "gsc"
        ? db.query.propertyCrawlSnapshots.findFirst({
          where: (crawl, { eq: eqFn }) => eqFn(crawl.propertyId, property.id),
          orderBy: (crawl) => [desc(crawl.createdAt)],
          columns: { createdAt: true },
        })
        : Promise.resolve(null),
      property.type === "gsc"
        ? db.query.propertyRefreshJobs.findMany({
          where: and(
            eq(propertyRefreshJobs.propertyId, property.id),
            isNull(propertyRefreshJobs.supersededAt),
            inArray(propertyRefreshJobs.status, ["queued", "processing"]),
          ),
          columns: { payload: true },
        })
        : Promise.resolve([]),
      property.type === "gsc"
        ? db.query.metricsBackfillJobs.findFirst({
          where: and(
            eq(metricsBackfillJobs.targetPropertyId, property.id),
            eq(metricsBackfillJobs.reason, "active_property_daily"),
            inArray(metricsBackfillJobs.status, ["queued", "processing"]),
          ),
          columns: { id: true },
        })
        : Promise.resolve(null),
    ]);
    const sources = refreshJobs.map((job) => {
      const payload = (job.payload as Record<string, unknown> | null) ?? null;
      return payload?.triggerSource === "automation" || payload?.triggerSource === "scheduler" ? "automation" : "manual";
    });

    return {
      id: property.id,
      teamId: property.teamId,
      teamTier: tierByTeamId.get(property.teamId) ?? "free",
      type: property.type,
      name: property.name,
      url: property.url,
      ga4PropertyId: property.ga4PropertyId,
      active: property.active,
      latestCrawlCreatedAt: latestCrawl?.createdAt?.toISOString() ?? null,
      hasActiveAutomationRefresh: sources.includes("automation"),
      hasActiveManualRefresh: sources.includes("manual"),
      hasActiveMetricsJob: Boolean(metricsJob),
    };
  }));
}

async function getTeamOwnerWithGoogleAccount(teamId: string) {
  const owner = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, "owner")),
  });
  if (!owner) return null;

  const googleAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, owner.userId), eq(account.providerId, "google")),
    columns: { id: true },
  });
  if (!googleAccount) return null;

  return owner;
}

export async function enqueueActivePropertyAutomation(input: {
  now?: Date;
} = {}) {
  const now = input.now ?? new Date();
  const plan = buildActivePropertyAutomationPlan({
    now,
    properties: await loadAutomationProperties(),
  });
  const window = getDailyMetricsRefreshWindow(now);
  let metricsEnqueued = 0;
  let crawlEnqueued = 0;
  const ownerByTeam = new Map<string, Awaited<ReturnType<typeof getTeamOwnerWithGoogleAccount>>>();

  const getOwner = async (teamId: string) => {
    if (!ownerByTeam.has(teamId)) {
      ownerByTeam.set(teamId, await getTeamOwnerWithGoogleAccount(teamId));
    }
    return ownerByTeam.get(teamId) ?? null;
  };

  for (const item of plan.metricsRefreshes) {
    const owner = await getOwner(item.teamId);
    if (!owner) continue;
    const existing = await db.query.metricsBackfillJobs.findFirst({
      where: and(
        eq(metricsBackfillJobs.teamId, item.teamId),
        eq(metricsBackfillJobs.targetPropertyId, item.propertyId),
        eq(metricsBackfillJobs.reason, "active_property_daily"),
        eq(metricsBackfillJobs.dateStart, window.dateStart),
        eq(metricsBackfillJobs.dateEnd, window.dateEnd),
      ),
      columns: { id: true },
    });
    if (existing) continue;
    await createMetricsBackfillJob({
      teamId: item.teamId,
      triggeredByUserId: owner.userId,
      targetUserId: owner.userId,
      targetPropertyId: item.propertyId,
      includeGsc: true,
      includeGa4: true,
      dateStart: window.dateStart,
      dateEnd: window.dateEnd,
      reason: "active_property_daily",
      timeframeMode: "preset",
      refreshRecentDays: 14,
      triggerSource: "automation",
    });
    metricsEnqueued += 1;
  }

  for (const item of plan.crawlRefreshes) {
    const owner = await getOwner(item.teamId);
    if (!owner) continue;
    await enqueuePropertyRefreshJob({
      teamId: item.teamId,
      propertyId: item.propertyId,
      triggeredByUserId: owner.userId,
      jobType: "crawl_refresh",
      triggerSource: "automation",
      payload: {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: null,
        endDate: null,
      },
    });
    crawlEnqueued += 1;
  }

  return { metricsEnqueued, crawlEnqueued };
}

export function startActivePropertyAutomationScheduler(input: {
  intervalMs?: number;
  timeZone?: string;
} = {}) {
  const intervalMs = input.intervalMs ?? Number(process.env.ACTIVE_PROPERTY_AUTOMATION_INTERVAL_MS ?? 60 * 60 * 1000);
  let lastRunKey: string | null = null;

  const runIfDue = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: input.timeZone ?? process.env.ACTIVE_PROPERTY_AUTOMATION_TIMEZONE ?? "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });
    const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
    const hour = Number(parts.hour);
    const runKey = `${parts.year}-${parts.month}-${parts.day}`;
    if (hour < Number(process.env.ACTIVE_PROPERTY_AUTOMATION_START_HOUR ?? "6")) return;
    if (lastRunKey === runKey) return;
    lastRunKey = runKey;
    void enqueueActivePropertyAutomation({ now }).catch((error) => {
      console.error("[active-property-automation] scheduler failed", error);
    });
  };

  runIfDue();
  const timer = setInterval(runIfDue, intervalMs);
  return {
    stop: () => clearInterval(timer),
  };
}

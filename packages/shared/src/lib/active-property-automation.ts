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
  const gscPropertyIds = rows
    .filter((property) => property.type === "gsc")
    .map((property) => property.id);

  const [crawlRows, refreshJobRows, metricsJobRows] = gscPropertyIds.length === 0
    ? [[], [], []] as const
    : await Promise.all([
      db.query.propertyCrawlSnapshots.findMany({
        where: inArray(propertyCrawlSnapshots.propertyId, gscPropertyIds),
        orderBy: (crawl) => [desc(crawl.createdAt)],
        columns: { propertyId: true, createdAt: true },
      }),
      db.query.propertyRefreshJobs.findMany({
        where: and(
          inArray(propertyRefreshJobs.propertyId, gscPropertyIds),
          isNull(propertyRefreshJobs.supersededAt),
          inArray(propertyRefreshJobs.status, ["queued", "processing"]),
        ),
        columns: { propertyId: true, payload: true },
      }),
      db.query.metricsBackfillJobs.findMany({
        where: and(
          inArray(metricsBackfillJobs.targetPropertyId, gscPropertyIds),
          eq(metricsBackfillJobs.reason, "active_property_daily"),
          inArray(metricsBackfillJobs.status, ["queued", "processing"]),
        ),
        columns: { targetPropertyId: true },
      }),
    ]);

  const latestCrawlByPropertyId = new Map<string, Date>();
  for (const crawl of crawlRows) {
    if (!latestCrawlByPropertyId.has(crawl.propertyId)) {
      latestCrawlByPropertyId.set(crawl.propertyId, crawl.createdAt);
    }
  }

  const refreshSourcesByPropertyId = new Map<string, Array<"automation" | "manual">>();
  for (const job of refreshJobRows) {
    const payload = (job.payload as Record<string, unknown> | null) ?? null;
    const source = payload?.triggerSource === "automation" || payload?.triggerSource === "scheduler"
      ? "automation"
      : "manual";
    const sources = refreshSourcesByPropertyId.get(job.propertyId) ?? [];
    sources.push(source);
    refreshSourcesByPropertyId.set(job.propertyId, sources);
  }

  const metricsJobPropertyIds = new Set(
    metricsJobRows
      .map((job) => job.targetPropertyId)
      .filter((propertyId): propertyId is string => Boolean(propertyId)),
  );

  return rows.map((property) => {
    const latestCrawlCreatedAt = latestCrawlByPropertyId.get(property.id);
    const sources = refreshSourcesByPropertyId.get(property.id) ?? [];

    return {
      id: property.id,
      teamId: property.teamId,
      teamTier: tierByTeamId.get(property.teamId) ?? "free",
      type: property.type,
      name: property.name,
      url: property.url,
      ga4PropertyId: property.ga4PropertyId,
      active: property.active,
      latestCrawlCreatedAt: latestCrawlCreatedAt?.toISOString() ?? null,
      hasActiveAutomationRefresh: sources.includes("automation"),
      hasActiveManualRefresh: sources.includes("manual"),
      hasActiveMetricsJob: metricsJobPropertyIds.has(property.id),
    };
  });
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

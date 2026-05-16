import { createRequire } from "node:module"; const require = createRequire(import.meta.url);
import {
  enqueuePropertyRefreshJob
} from "./chunk-I7SB5PNI.js";
import {
  createMetricsBackfillJob
} from "./chunk-QVK4I53Z.js";
import "./chunk-3WHTUT5J.js";
import {
  db
} from "./chunk-4PAZP4FF.js";
import {
  desc
} from "./chunk-ZV6HF4A7.js";
import {
  and,
  eq,
  inArray,
  isNull
} from "./chunk-EJUXHIF3.js";
import {
  account,
  metricsBackfillJobs,
  propertyCrawlSnapshots,
  propertyRefreshJobs,
  teamMembers
} from "./chunk-BBVSZM4K.js";
import "./chunk-VNGVKUAM.js";
import "./chunk-3RY4ISVK.js";

// packages/shared/src/lib/active-property-automation-policy.ts
function toDateString(value) {
  return value.toISOString().slice(0, 10);
}
function getDailyMetricsRefreshWindow(now = /* @__PURE__ */ new Date()) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 13);
  return {
    dateStart: toDateString(start),
    dateEnd: toDateString(end)
  };
}
function isCrawlFresh(createdAt, now) {
  if (!createdAt) return false;
  const parsed = new Date(createdAt).getTime();
  if (Number.isNaN(parsed)) return false;
  return now.getTime() - parsed < 24 * 60 * 60 * 1e3;
}
function buildActivePropertyAutomationPlan(input) {
  const now = input.now ?? /* @__PURE__ */ new Date();
  const ga4ById = new Map(input.properties.filter((property) => property.type === "ga4").map((property) => [property.id, property]));
  const metricsRefreshes = [];
  const crawlRefreshes = [];
  for (const property of input.properties) {
    if (property.type !== "gsc" || !property.active || !property.ga4PropertyId) continue;
    if ((property.teamTier ?? "free") === "free") continue;
    const linkedGa4 = ga4ById.get(`ga4_${property.ga4PropertyId}`);
    if (!linkedGa4?.active) continue;
    if (!property.hasActiveMetricsJob) {
      metricsRefreshes.push({
        teamId: property.teamId,
        propertyId: property.id,
        ga4PropertyId: property.ga4PropertyId
      });
    }
    if (!property.hasActiveManualRefresh && !property.hasActiveAutomationRefresh && !isCrawlFresh(property.latestCrawlCreatedAt, now)) {
      crawlRefreshes.push({
        teamId: property.teamId,
        propertyId: property.id
      });
    }
  }
  return { metricsRefreshes, crawlRefreshes };
}

// packages/shared/src/lib/active-property-automation.ts
async function loadAutomationProperties() {
  const [rows, teamRows] = await Promise.all([
    db.query.properties.findMany({
      where: (property, { eq: eqFn }) => eqFn(property.active, true)
    }),
    db.query.teams.findMany({
      columns: { id: true, tier: true }
    })
  ]);
  const tierByTeamId = new Map(teamRows.map((team) => [team.id, team.tier]));
  const gscPropertyIds = rows.filter((property) => property.type === "gsc").map((property) => property.id);
  const [crawlRows, refreshJobRows, metricsJobRows] = gscPropertyIds.length === 0 ? [[], [], []] : await Promise.all([
    db.query.propertyCrawlSnapshots.findMany({
      where: inArray(propertyCrawlSnapshots.propertyId, gscPropertyIds),
      orderBy: (crawl) => [desc(crawl.createdAt)],
      columns: { propertyId: true, createdAt: true }
    }),
    db.query.propertyRefreshJobs.findMany({
      where: and(
        inArray(propertyRefreshJobs.propertyId, gscPropertyIds),
        isNull(propertyRefreshJobs.supersededAt),
        inArray(propertyRefreshJobs.status, ["queued", "processing"])
      ),
      columns: { propertyId: true, payload: true }
    }),
    db.query.metricsBackfillJobs.findMany({
      where: and(
        inArray(metricsBackfillJobs.targetPropertyId, gscPropertyIds),
        eq(metricsBackfillJobs.reason, "active_property_daily"),
        inArray(metricsBackfillJobs.status, ["queued", "processing"])
      ),
      columns: { targetPropertyId: true }
    })
  ]);
  const latestCrawlByPropertyId = /* @__PURE__ */ new Map();
  for (const crawl of crawlRows) {
    if (!latestCrawlByPropertyId.has(crawl.propertyId)) {
      latestCrawlByPropertyId.set(crawl.propertyId, crawl.createdAt);
    }
  }
  const refreshSourcesByPropertyId = /* @__PURE__ */ new Map();
  for (const job of refreshJobRows) {
    const payload = job.payload ?? null;
    const source = payload?.triggerSource === "automation" || payload?.triggerSource === "scheduler" ? "automation" : "manual";
    const sources = refreshSourcesByPropertyId.get(job.propertyId) ?? [];
    sources.push(source);
    refreshSourcesByPropertyId.set(job.propertyId, sources);
  }
  const metricsJobPropertyIds = new Set(
    metricsJobRows.map((job) => job.targetPropertyId).filter((propertyId) => Boolean(propertyId))
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
      hasActiveMetricsJob: metricsJobPropertyIds.has(property.id)
    };
  });
}
async function getTeamOwnerWithGoogleAccount(teamId) {
  const owner = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, "owner"))
  });
  if (!owner) return null;
  const googleAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, owner.userId), eq(account.providerId, "google")),
    columns: { id: true }
  });
  if (!googleAccount) return null;
  return owner;
}
async function enqueueActivePropertyAutomation(input = {}) {
  const now = input.now ?? /* @__PURE__ */ new Date();
  const plan = buildActivePropertyAutomationPlan({
    now,
    properties: await loadAutomationProperties()
  });
  const window = getDailyMetricsRefreshWindow(now);
  let metricsEnqueued = 0;
  let crawlEnqueued = 0;
  const ownerByTeam = /* @__PURE__ */ new Map();
  const getOwner = async (teamId) => {
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
        eq(metricsBackfillJobs.dateEnd, window.dateEnd)
      ),
      columns: { id: true }
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
      triggerSource: "automation"
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
        endDate: null
      }
    });
    crawlEnqueued += 1;
  }
  return { metricsEnqueued, crawlEnqueued };
}
function startActivePropertyAutomationScheduler(input = {}) {
  const intervalMs = input.intervalMs ?? Number(process.env.ACTIVE_PROPERTY_AUTOMATION_INTERVAL_MS ?? 60 * 60 * 1e3);
  let lastRunKey = null;
  const runIfDue = () => {
    const now = /* @__PURE__ */ new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: input.timeZone ?? process.env.ACTIVE_PROPERTY_AUTOMATION_TIMEZONE ?? "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false
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
    stop: () => clearInterval(timer)
  };
}
export {
  buildActivePropertyAutomationPlan,
  enqueueActivePropertyAutomation,
  getDailyMetricsRefreshWindow,
  startActivePropertyAutomationScheduler
};

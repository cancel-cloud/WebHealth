export type ActiveAutomationProperty = {
  id: string;
  teamId: string;
  type: string;
  name: string;
  url: string;
  ga4PropertyId: string | null;
  active: boolean;
  latestCrawlCreatedAt: string | null;
  hasActiveAutomationRefresh: boolean;
  hasActiveManualRefresh: boolean;
  hasActiveMetricsJob: boolean;
};

export type ActivePropertyAutomationPlan = {
  metricsRefreshes: Array<{ teamId: string; propertyId: string; ga4PropertyId: string }>;
  crawlRefreshes: Array<{ teamId: string; propertyId: string }>;
};

function toDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getDailyMetricsRefreshWindow(now = new Date()) {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - 1);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 13);

  return {
    dateStart: toDateString(start),
    dateEnd: toDateString(end),
  };
}

function isCrawlFresh(createdAt: string | null, now: Date) {
  if (!createdAt) return false;
  const parsed = new Date(createdAt).getTime();
  if (Number.isNaN(parsed)) return false;
  return now.getTime() - parsed < 24 * 60 * 60 * 1000;
}

export function buildActivePropertyAutomationPlan(input: {
  properties: ActiveAutomationProperty[];
  now?: Date;
}): ActivePropertyAutomationPlan {
  const now = input.now ?? new Date();
  const ga4ById = new Map(input.properties.filter((property) => property.type === "ga4").map((property) => [property.id, property]));
  const metricsRefreshes: ActivePropertyAutomationPlan["metricsRefreshes"] = [];
  const crawlRefreshes: ActivePropertyAutomationPlan["crawlRefreshes"] = [];

  for (const property of input.properties) {
    if (property.type !== "gsc" || !property.active || !property.ga4PropertyId) continue;
    const linkedGa4 = ga4ById.get(`ga4_${property.ga4PropertyId}`);
    if (!linkedGa4?.active) continue;

    if (!property.hasActiveMetricsJob) {
      metricsRefreshes.push({
        teamId: property.teamId,
        propertyId: property.id,
        ga4PropertyId: property.ga4PropertyId,
      });
    }

    if (
      !property.hasActiveManualRefresh &&
      !property.hasActiveAutomationRefresh &&
      !isCrawlFresh(property.latestCrawlCreatedAt, now)
    ) {
      crawlRefreshes.push({
        teamId: property.teamId,
        propertyId: property.id,
      });
    }
  }

  return { metricsRefreshes, crawlRefreshes };
}

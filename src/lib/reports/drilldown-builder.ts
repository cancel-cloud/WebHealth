import type { DrilldownPayload } from "./dashboard-blocks";
import { classifyQueryIntent } from "./deterministic/intent-labeler";
import type { PageIssue } from "@/lib/crawl";

type QueryPagePair = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type PageWinnerLoser = {
  page: string;
  clicksCurrent: number;
  clicksCompare: number;
  clicksDelta: number;
  impressionsCurrent: number;
  impressionsCompare: number;
  impressionsDelta: number;
};

type Ga4LandingPage = {
  join_key: string;
  sessions: number;
  engagementRate?: number;
  bounceRate?: number;
  engagedSessions?: number;
};

type DeviceRow = { device: string; clicks: number; impressions: number };
type CountryRow = { country: string; clicks: number; impressions: number };

export type DrilldownBuilderInput = {
  queryPagePairs: QueryPagePair[];
  pageWinnerLoserRows?: PageWinnerLoser[];
  ga4LandingPages?: Ga4LandingPage[];
  crawlPages?: PageIssue[];
  gscCurrentDevices?: DeviceRow[];
  gscCurrentCountries?: CountryRow[];
  domainName?: string;
};

/** Builds a query-type DrilldownPayload for a given query string. */
export function buildQueryDrilldown(
  query: string,
  input: DrilldownBuilderInput
): DrilldownPayload {
  const pairs = input.queryPagePairs.filter((p) => p.query === query);

  // Sort pages by impressions desc, take top 5
  const sorted = [...pairs].sort((a, b) => b.impressions - a.impressions).slice(0, 5);

  const topPages = sorted.map((p) => ({
    page: p.page,
    impressions: p.impressions,
    clicks: p.clicks,
    ctr: p.ctr,
    position: p.position,
    positionDelta: 0, // Would need compare data to compute; default to 0
  }));

  const recommendedPrimaryPage = topPages[0]?.page ?? null;

  // Use site-wide device/country as context (per-query dimension not available)
  const deviceSplit = (input.gscCurrentDevices ?? []).slice(0, 3).map((d) => ({
    device: d.device,
    clicks: d.clicks,
    impressions: d.impressions,
  }));
  const countrySplit = (input.gscCurrentCountries ?? []).slice(0, 3).map((c) => ({
    country: c.country,
    clicks: c.clicks,
    impressions: c.impressions,
  }));

  return {
    type: "query",
    query,
    topPages,
    recommendedPrimaryPage,
    deviceSplit,
    countrySplit,
  };
}

/** Builds a page-type DrilldownPayload for a given page URL. */
export function buildPageDrilldown(
  page: string,
  input: DrilldownBuilderInput
): DrilldownPayload {
  const pairs = input.queryPagePairs.filter((p) => p.page === page);

  // Sort by impressions desc, take top 8, label intent
  const topQueries = [...pairs]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 8)
    .map((p) => ({
      query: p.query,
      impressions: p.impressions,
      clicks: p.clicks,
      ctr: p.ctr,
      position: p.position,
      intent: classifyQueryIntent(p.query, input.domainName),
    }));

  // Get GSC deltas from pageWinnerLoserRows
  const winnerRow = input.pageWinnerLoserRows?.find((r) => r.page === page);
  const gscDeltas = winnerRow
    ? {
        clicksDelta: winnerRow.clicksDelta,
        impressionsDelta: winnerRow.impressionsDelta,
        positionDelta: 0, // not stored in that type
      }
    : { clicksDelta: 0, impressionsDelta: 0, positionDelta: 0 };

  // GA4 organic data — match by join_key (path)
  const path = (() => {
    try {
      return new URL(page, "https://placeholder.invalid").pathname;
    } catch {
      return page;
    }
  })();
  const ga4Row = input.ga4LandingPages?.find(
    (lp) => lp.join_key === path || lp.join_key === page
  );
  const ga4Organic = ga4Row
    ? {
        sessions: ga4Row.sessions,
        engagedSessions: ga4Row.engagedSessions ?? 0,
        engagementRate: ga4Row.engagementRate ?? 0,
        bounceRate: ga4Row.bounceRate ?? (ga4Row.engagementRate != null ? 1 - ga4Row.engagementRate : 0),
      }
    : null;

  // Crawl flags — match page URL
  const crawlPage = input.crawlPages?.find(
    (cp) => cp.url === page || cp.url.endsWith(path)
  );
  const crawlFlags = {
    missingTitle: crawlPage ? crawlPage.issues.some((i) => i.includes("<title>") || i.toLowerCase().includes("title")) : false,
    missingMeta: crawlPage ? crawlPage.issues.some((i) => i.includes("meta description") || i.toLowerCase().includes("meta")) : false,
    multipleH1: crawlPage ? crawlPage.h1Count > 1 : false,
    canonicalIssue: crawlPage ? !!crawlPage.canonicalUrl && crawlPage.canonicalUrl !== page : false,
  };

  return {
    type: "page",
    page,
    topQueries,
    gscDeltas,
    ga4Organic,
    crawlFlags,
  };
}

/**
 * Builds all query drilldowns for a set of queries (top 50).
 * Returns a Record<query, DrilldownPayload>.
 */
export function buildQueryDrilldowns(
  queries: string[],
  input: DrilldownBuilderInput
): Record<string, DrilldownPayload> {
  const result: Record<string, DrilldownPayload> = {};
  for (const q of queries.slice(0, 50)) {
    result[q] = buildQueryDrilldown(q, input);
  }
  return result;
}

/**
 * Builds all page drilldowns for a set of pages (top 50).
 * Returns a Record<page, DrilldownPayload>.
 */
export function buildPageDrilldowns(
  pages: string[],
  input: DrilldownBuilderInput
): Record<string, DrilldownPayload> {
  const result: Record<string, DrilldownPayload> = {};
  for (const p of pages.slice(0, 50)) {
    result[p] = buildPageDrilldown(p, input);
  }
  return result;
}

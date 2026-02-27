import { classifyQueryIntent, type QueryIntent } from "./intent-labeler";

export type ContentGapRow = {
  gapType: "A" | "B" | "C";
  query: string;
  intent: QueryIntent;
  primaryPage: string | null;
  evidenceMetrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
    engagementRate?: number;
    bounceRate?: number;
    sessions?: number;
  };
  suggestedAction: string;
  priorityScore: number;
};

type QueryPagePair = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type Ga4LandingPage = {
  join_key: string;
  sessions: number;
  engagementRate?: number;
  bounceRate?: number;
};

const CTR_BENCHMARK: Record<string, number> = {
  "1-3": 0.2,
  "4-10": 0.06,
  "11-20": 0.02,
  "21+": 0.005,
};

function positionBucket(pos: number) {
  if (pos <= 3) return "1-3";
  if (pos <= 10) return "4-10";
  if (pos <= 20) return "11-20";
  return "21+";
}

function benchmarkCtr(position: number) {
  return CTR_BENCHMARK[positionBucket(position)] ?? 0.005;
}

export function buildContentGapRows(params: {
  queryPagePairs: QueryPagePair[];
  ga4LandingPages: Ga4LandingPage[];
  domainName?: string;
}): { rows: ContentGapRow[]; warnings: string[] } {
  const warnings: string[] = [];

  if (!params.queryPagePairs || params.queryPagePairs.length === 0) {
    warnings.push("GSC query/page pairs unavailable; content gap and cannibalization analysis skipped");
    return { rows: [], warnings };
  }

  const ga4Map = new Map(params.ga4LandingPages.map((p) => [p.join_key, p]));
  const hasGa4 = params.ga4LandingPages.length > 0;
  if (!hasGa4) {
    warnings.push("GA4 engagement data unavailable; Gap B and Gap C classification skipped");
  }

  // Aggregate query impressions/clicks/position across all pages
  const queryAgg = new Map<string, { impressions: number; clicks: number; ctr: number; position: number; pages: Set<string> }>();
  for (const pair of params.queryPagePairs) {
    const key = pair.query.toLowerCase();
    if (!queryAgg.has(key)) {
      queryAgg.set(key, { impressions: 0, clicks: 0, ctr: 0, position: 0, pages: new Set() });
    }
    const agg = queryAgg.get(key)!;
    agg.impressions += pair.impressions;
    agg.clicks += pair.clicks;
    agg.pages.add(pair.page);
    // Use best position (lowest number)
    if (agg.position === 0 || pair.position < agg.position) {
      agg.position = pair.position;
      agg.ctr = pair.ctr;
    }
  }

  // Best page per query (by impressions)
  const bestPageForQuery = new Map<string, { page: string; impressions: number; position: number; ctr: number }>();
  for (const pair of params.queryPagePairs) {
    const key = pair.query.toLowerCase();
    const existing = bestPageForQuery.get(key);
    if (!existing || pair.impressions > existing.impressions) {
      bestPageForQuery.set(key, { page: pair.page, impressions: pair.impressions, position: pair.position, ctr: pair.ctr });
    }
  }

  const gapA: ContentGapRow[] = [];
  const gapB: ContentGapRow[] = [];
  const gapC: ContentGapRow[] = [];

  for (const [query, agg] of queryAgg.entries()) {
    if (agg.impressions < 200) continue;

    const intent = classifyQueryIntent(query, params.domainName);
    const bestPage = bestPageForQuery.get(query);
    const allPages = [...agg.pages];

    // Top page share — if top page has < 50% of impressions, signal is dispersed
    const topPageImpressions = bestPage?.impressions ?? 0;
    const topPageShare = agg.impressions > 0 ? topPageImpressions / agg.impressions : 0;

    // Find GA4 data for best page
    const ga4Data = bestPage ? ga4Map.get(bestPage.page) : undefined;

    // GAP A — no consistent page ranking for this query
    if (!bestPage || topPageShare < 0.5) {
      const priorityScore = agg.impressions * (1 - topPageShare);
      gapA.push({
        gapType: "A",
        query,
        intent,
        primaryPage: bestPage?.page ?? null,
        evidenceMetrics: {
          impressions: agg.impressions,
          clicks: agg.clicks,
          ctr: agg.ctr,
          position: agg.position,
        },
        suggestedAction: `Create new pillar page targeting "${query}" — no single page dominates this query cluster`,
        priorityScore: Math.round(priorityScore),
      });
      continue;
    }

    // GAP B — wrong page ranks (weak engagement)
    if (hasGa4 && ga4Data) {
      const hasWeakEngagement =
        (ga4Data.engagementRate !== undefined && ga4Data.engagementRate < 0.4) ||
        (ga4Data.bounceRate !== undefined && ga4Data.bounceRate > 0.6);
      const hasWeakCtr = agg.ctr < benchmarkCtr(agg.position) * 0.6;

      if (hasWeakEngagement || hasWeakCtr) {
        const ctrGap = Math.max(0, benchmarkCtr(agg.position) - agg.ctr);
        const priorityScore = Math.round(agg.impressions * (1 + ctrGap));
        gapB.push({
          gapType: "B",
          query,
          intent,
          primaryPage: bestPage.page,
          evidenceMetrics: {
            impressions: agg.impressions,
            clicks: agg.clicks,
            ctr: agg.ctr,
            position: agg.position,
            engagementRate: ga4Data.engagementRate,
            bounceRate: ga4Data.bounceRate,
            sessions: ga4Data.sessions,
          },
          suggestedAction: `Improve or relocate content on "${bestPage.page}" to better match this query intent; update internal links`,
          priorityScore,
        });
        continue;
      }
    }

    // GAP C — correct page, but content section missing (position 4–20, underperforming CTR)
    if (agg.position >= 4 && agg.position <= 20 && agg.impressions >= 100) {
      const expectedCtr = benchmarkCtr(agg.position);
      const ctrRatio = agg.ctr / expectedCtr;
      if (ctrRatio < 0.7) {
        const ctrGap = expectedCtr - agg.ctr;
        const priorityScore = Math.round(agg.impressions * ctrGap * 2);
        gapC.push({
          gapType: "C",
          query,
          intent,
          primaryPage: bestPage.page,
          evidenceMetrics: {
            impressions: agg.impressions,
            clicks: agg.clicks,
            ctr: agg.ctr,
            position: agg.position,
            ...(ga4Data
              ? {
                  engagementRate: ga4Data.engagementRate,
                  bounceRate: ga4Data.bounceRate,
                  sessions: ga4Data.sessions,
                }
              : {}),
          },
          suggestedAction: `Add ${intent === "commercial" ? "comparison section" : "FAQ or dedicated section"} to "${bestPage.page}" targeting "${query}"; rewrite H1/meta to directly address query`,
          priorityScore,
        });
      }
    }
  }

  // Sort and cap each type
  gapA.sort((a, b) => b.priorityScore - a.priorityScore);
  gapB.sort((a, b) => b.priorityScore - a.priorityScore);
  gapC.sort((a, b) => b.priorityScore - a.priorityScore);

  const rows = [
    ...gapA.slice(0, 15),
    ...gapB.slice(0, 15),
    ...gapC.slice(0, 10),
  ].sort((a, b) => b.priorityScore - a.priorityScore);

  return { rows, warnings };
}

import type {
  ActionBacklogRow,
  AlertsAndFlags,
  CannibalizationRow,
  ContentDecayRow,
  CtrBenchmarkSummary,
  KpiTrendRow,
  LostClickEstimateRow,
  NearWinKeywordRow,
  PageWinnerLoserRow,
  QueryOpportunityRow,
  ReportSectionPriority,
  ScoringMethodology,
  SiteChanges,
  TechnicalIssueRow,
  WorkbookDatasetV2,
} from "@webhealth/shared/lib/reports/types";
import type { CrawlResult } from "@webhealth/shared/lib/crawl";

type QueryMetric = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type PageMetric = {
  page: string;
  clicks: number;
  impressions: number;
};

type QueryPagePair = {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type GscRange = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: QueryMetric[];
  topPages: PageMetric[];
  topCountries?: Array<Record<string, unknown>>;
  topDevices?: Array<Record<string, unknown>>;
};

type Ga4Range = {
  sessions: number;
  users: number;
  newUsers?: number;
  trafficSources?: Array<{ medium: string; sessions: number; users: number }>;
  landingPages?: Array<{ landingPage: string; sessions: number; pageviews: number }>;
};

type TimeSeriesPoint = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  sessions?: number;
  users?: number;
};

export type DeterministicInsights = {
  kpiComparisonRows: Array<{
    metric: string;
    previous: string;
    current: string;
    delta: string;
    assessment: string;
  }>;
  kpiTrendRows: KpiTrendRow[];
  queryOpportunityRows: QueryOpportunityRow[];
  pageWinnerLoserRows: PageWinnerLoserRow[];
  nearWinKeywordRows: NearWinKeywordRow[];
  cannibalizationRows: CannibalizationRow[];
  technicalIssueRows: TechnicalIssueRow[];
  actionBacklogRows: ActionBacklogRow[];
  workbookDataset: WorkbookDatasetV2;
  executiveSummary: {
    headline: string;
    topActionAreas: string[];
  };
  contentDecayRows: ContentDecayRow[];
  lostClickEstimateRows: LostClickEstimateRow[];
  ctrBenchmarkSummary: CtrBenchmarkSummary;
  alertsAndFlags: AlertsAndFlags;
  scoringMethodology: ScoringMethodology;
};

export type BuildDeterministicInsightsInput = {
  gscCurrent: GscRange;
  gscCompare: GscRange;
  ga4Current: Ga4Range | null;
  ga4Compare: Ga4Range | null;
  crawl: CrawlResult | null;
  siteChanges: SiteChanges;
  currentSeries: TimeSeriesPoint[];
  compareSeries: TimeSeriesPoint[];
  queryPagePairsCurrent?: QueryPagePair[];
  compareRangeEnd?: string;
};

function asNumber(n: unknown) {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  return 0;
}

function pct(delta: number, base: number) {
  if (!base) return "0.0%";
  return `${((delta / base) * 100).toFixed(1)}%`;
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return (value - min) / (max - min);
}

function expectedCtrAtPosition(position: number) {
  if (position <= 1) return 0.31;
  if (position <= 2) return 0.2;
  if (position <= 3) return 0.12;
  if (position <= 5) return 0.08;
  if (position <= 8) return 0.05;
  if (position <= 12) return 0.03;
  if (position <= 20) return 0.015;
  return 0.008;
}

function clampRows<T>(rows: T[], cap = 100) {
  return rows.slice(0, cap);
}

function buildKpiComparisonRows(input: BuildDeterministicInsightsInput) {
  const rows = [
    {
      metric: "GSC Clicks",
      previous: String(input.gscCompare.clicks),
      current: String(input.gscCurrent.clicks),
      delta: String(input.gscCurrent.clicks - input.gscCompare.clicks),
      assessment: input.gscCurrent.clicks >= input.gscCompare.clicks ? "Positive" : "Decline",
    },
    {
      metric: "GSC Impressions",
      previous: String(input.gscCompare.impressions),
      current: String(input.gscCurrent.impressions),
      delta: String(input.gscCurrent.impressions - input.gscCompare.impressions),
      assessment: input.gscCurrent.impressions >= input.gscCompare.impressions ? "Positive" : "Decline",
    },
    {
      metric: "GSC CTR",
      previous: `${(input.gscCompare.ctr * 100).toFixed(2)}%`,
      current: `${(input.gscCurrent.ctr * 100).toFixed(2)}%`,
      delta: `${((input.gscCurrent.ctr - input.gscCompare.ctr) * 100).toFixed(2)}%`,
      assessment: input.gscCurrent.ctr >= input.gscCompare.ctr ? "Positive" : "Decline",
    },
    {
      metric: "GSC Avg Position",
      previous: input.gscCompare.position.toFixed(2),
      current: input.gscCurrent.position.toFixed(2),
      delta: (input.gscCurrent.position - input.gscCompare.position).toFixed(2),
      assessment: input.gscCurrent.position <= input.gscCompare.position ? "Positive" : "Decline",
    },
  ];

  if (input.ga4Current && input.ga4Compare) {
    rows.push(
      {
        metric: "GA4 Sessions",
        previous: String(input.ga4Compare.sessions),
        current: String(input.ga4Current.sessions),
        delta: String(input.ga4Current.sessions - input.ga4Compare.sessions),
        assessment: input.ga4Current.sessions >= input.ga4Compare.sessions ? "Positive" : "Decline",
      },
      {
        metric: "GA4 Users",
        previous: String(input.ga4Compare.users),
        current: String(input.ga4Current.users),
        delta: String(input.ga4Current.users - input.ga4Compare.users),
        assessment: input.ga4Current.users >= input.ga4Compare.users ? "Positive" : "Decline",
      }
    );
  }

  return rows;
}

function buildKpiTrends(input: BuildDeterministicInsightsInput): KpiTrendRow[] {
  const compareByDate = new Map(input.compareSeries.map((row) => [row.date, row]));
  return clampRows(
    input.currentSeries.map((row) => {
      const cmp = compareByDate.get(row.date);
      return {
        date: row.date,
        clicksCurrent: row.clicks,
        clicksCompare: asNumber(cmp?.clicks),
        impressionsCurrent: row.impressions,
        impressionsCompare: asNumber(cmp?.impressions),
        ctrCurrent: row.ctr,
        ctrCompare: asNumber(cmp?.ctr),
        positionCurrent: row.position,
        positionCompare: asNumber(cmp?.position),
        sessionsCurrent: row.sessions,
        sessionsCompare: asNumber(cmp?.sessions),
        usersCurrent: row.users,
        usersCompare: asNumber(cmp?.users),
      } satisfies KpiTrendRow;
    }),
    180
  );
}

function buildQueryOpportunities(currentQueries: QueryMetric[]) {
  const enriched = currentQueries.map((q) => {
    const expectedCtr = expectedCtrAtPosition(q.position);
    const lostClicksEstimate = q.impressions * Math.max(expectedCtr - q.ctr, 0);
    return { ...q, expectedCtr, lostClicksEstimate };
  });

  const impressionMin = Math.min(...enriched.map((q) => q.impressions), 0);
  const impressionMax = Math.max(...enriched.map((q) => q.impressions), 1);
  const lostMin = Math.min(...enriched.map((q) => q.lostClicksEstimate), 0);
  const lostMax = Math.max(...enriched.map((q) => q.lostClicksEstimate), 1);

  return clampRows(
    enriched
      .map((q) => {
        const severityWeight = q.position >= 8 && q.position <= 20 ? 1 : q.position <= 7 ? 0.6 : 0.4;
        const opportunityScore =
          100 *
          (0.4 * normalize(q.impressions, impressionMin, impressionMax) +
            0.4 * normalize(q.lostClicksEstimate, lostMin, lostMax) +
            0.2 * severityWeight);

        return {
          query: q.query,
          clicks: q.clicks,
          impressions: q.impressions,
          ctr: q.ctr,
          position: q.position,
          expectedCtr: q.expectedCtr,
          lostClicksEstimate: Number(q.lostClicksEstimate.toFixed(2)),
          opportunityScore: Number(opportunityScore.toFixed(2)),
          recommendedAction:
            q.position > 10
              ? "Expand topical depth and strengthen internal links to this landing page"
              : "Rewrite title/meta and align snippet intent to improve CTR",
        } satisfies QueryOpportunityRow;
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore),
    50
  );
}

function buildPageWinnersLosers(currentPages: PageMetric[], comparePages: PageMetric[]) {
  const compareMap = new Map(comparePages.map((p) => [p.page, p]));
  const rows = currentPages.map((p) => {
    const prev = compareMap.get(p.page);
    const clicksCompare = prev?.clicks ?? 0;
    const impressionsCompare = prev?.impressions ?? 0;
    const clicksDelta = p.clicks - clicksCompare;
    const impressionsDelta = p.impressions - impressionsCompare;
    return {
      page: p.page,
      clicksCurrent: p.clicks,
      clicksCompare,
      clicksDelta,
      impressionsCurrent: p.impressions,
      impressionsCompare,
      impressionsDelta,
      status:
        clicksDelta > 0 ? "winner" : clicksDelta < 0 ? "loser" : "flat",
    } satisfies PageWinnerLoserRow;
  });

  return clampRows(
    rows.sort((a, b) => Math.abs(b.clicksDelta) - Math.abs(a.clicksDelta)),
    50
  );
}

function buildNearWinKeywords(rows: QueryMetric[], pageRows: PageMetric[]) {
  const landing = pageRows[0]?.page;
  return clampRows(
    rows
      .filter((q) => q.position >= 8 && q.position <= 20)
      .sort((a, b) => b.impressions - a.impressions)
      .map((q) => ({
        keyword: q.query,
        position: q.position,
        impressions: q.impressions,
        clicks: q.clicks,
        ctr: q.ctr,
        targetLandingPage: landing,
        action: "Improve on-page relevance and add supporting FAQ/section for this query",
      } satisfies NearWinKeywordRow)),
    40
  );
}

function buildCannibalization(rows: QueryPagePair[] | undefined) {
  if (!rows || rows.length === 0) return [];

  const grouped = new Map<string, QueryPagePair[]>();
  for (const row of rows) {
    const key = row.query.trim().toLowerCase();
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  const result: CannibalizationRow[] = [];
  for (const [query, entries] of grouped.entries()) {
    const distinctPages = [...new Set(entries.map((e) => e.page))];
    if (distinctPages.length < 2) continue;
    const totalClicks = entries.reduce((sum, e) => sum + e.clicks, 0);
    const totalImpressions = entries.reduce((sum, e) => sum + e.impressions, 0);
    result.push({
      query,
      pages: distinctPages.slice(0, 5),
      totalClicks,
      totalImpressions,
      recommendation:
        "Consolidate intent: choose primary landing page, strengthen internal linking, and de-optimize secondary pages for this exact term.",
      actionDetail: null,
    });
  }

  return clampRows(result.sort((a, b) => b.totalImpressions - a.totalImpressions), 25);
}

function buildTechnicalIssueRows(crawl: CrawlResult | null, topPages: PageMetric[]) {
  if (!crawl) return [];

  const pageClicks = new Map(topPages.map((p) => [p.page, p.clicks]));
  const issueBuckets = new Map<string, { affectedPages: number; affectedEstimatedClicks: number }>();

  for (const page of crawl.pages ?? []) {
    const estimatedClicks = pageClicks.get(page.url) ?? 0;
    for (const issue of page.issues ?? []) {
      const key = issue.trim();
      if (!issueBuckets.has(key)) {
        issueBuckets.set(key, { affectedPages: 0, affectedEstimatedClicks: 0 });
      }
      const bucket = issueBuckets.get(key)!;
      bucket.affectedPages += 1;
      bucket.affectedEstimatedClicks += estimatedClicks;
    }
  }

  const rows: TechnicalIssueRow[] = [...issueBuckets.entries()].map(([issueType, bucket]) => {
    const severity: TechnicalIssueRow["severity"] =
      bucket.affectedPages >= 15 || bucket.affectedEstimatedClicks > 100
        ? "KRITISCH"
        : bucket.affectedPages >= 8 || bucket.affectedEstimatedClicks > 40
          ? "HOCH"
          : bucket.affectedPages >= 3 || bucket.affectedEstimatedClicks > 10
            ? "MITTEL"
            : "NIEDRIG";

    return {
      issueType,
      affectedPages: bucket.affectedPages,
      affectedEstimatedClicks: bucket.affectedEstimatedClicks,
      severity,
      recommendation: "Fix templates/components first before page-by-page edits.",
    };
  });

  return clampRows(rows.sort((a, b) => b.affectedEstimatedClicks - a.affectedEstimatedClicks), 40);
}

function buildActionBacklog(input: {
  queryOpportunities: QueryOpportunityRow[];
  technicalIssues: TechnicalIssueRow[];
  siteChanges: SiteChanges;
}) {
  const rows: ActionBacklogRow[] = [];

  for (const row of input.technicalIssues.slice(0, 6)) {
    rows.push({
      id: `tech_${rows.length + 1}`,
      area: "technical",
      task: `Fix: ${row.issueType}`,
      ownerHint: "developer",
      effort: row.affectedPages > 10 ? "L" : row.affectedPages > 4 ? "M" : "S",
      impactScore: Math.min(100, row.affectedEstimatedClicks + row.affectedPages * 2),
      why: `${row.affectedPages} pages affected, est. clicks at risk: ${row.affectedEstimatedClicks}`,
      done: false,
    });
  }

  for (const row of input.queryOpportunities.slice(0, 6)) {
    rows.push({
      id: `seo_${rows.length + 1}`,
      area: "content",
      task: `Improve query opportunity: ${row.query}`,
      ownerHint: "seo",
      effort: row.position > 12 ? "M" : "S",
      impactScore: row.opportunityScore,
      why: `Lost clicks estimate: ${row.lostClicksEstimate.toFixed(1)}`,
      done: false,
    });
  }

  for (const page of input.siteChanges.changedPages.slice(0, 4)) {
    rows.push({
      id: `chg_${rows.length + 1}`,
      area: "onpage",
      task: `Validate impact after page change: ${page.url}`,
      ownerHint: "seo",
      effort: "S",
      impactScore: 45,
      why: page.machineDiffSummary ?? "Page changed and needs post-release SEO validation",
      done: false,
    });
  }

  return clampRows(rows.sort((a, b) => b.impactScore - a.impactScore), 20);
}

// Position bucket lower bounds: 1|2|3|4-5|6-8|9-12|13-20|21+
const POSITION_BUCKETS = [1, 2, 3, 4, 6, 9, 13, 21];

function positionToBucket(position: number): number {
  const floor = Math.floor(position);
  let bucket = POSITION_BUCKETS[0]!;
  for (const b of POSITION_BUCKETS) {
    if (floor >= b) bucket = b;
  }
  return bucket;
}

export function buildCtrBenchmarkCurve(queries: QueryMetric[]): CtrBenchmarkSummary {
  const computedAt = new Date().toISOString().slice(0, 10);

  if (queries.length < 10) {
    const siteAvgCtrByPosition: Record<string, number> = {};
    for (const b of POSITION_BUCKETS) {
      siteAvgCtrByPosition[String(b)] = expectedCtrAtPosition(b);
    }
    return {
      siteAvgCtrByPosition,
      positionBuckets: [],
      dataPoints: queries.length,
      computedAt,
      ctrBenchmarkSource: "global-fallback",
    };
  }

  // Group by bucket and compute weighted-avg CTR
  const bucketData = new Map<number, { totalImpressions: number; weightedCtrSum: number; count: number }>();
  for (const q of queries) {
    const bucket = positionToBucket(q.position);
    if (!bucketData.has(bucket)) {
      bucketData.set(bucket, { totalImpressions: 0, weightedCtrSum: 0, count: 0 });
    }
    const entry = bucketData.get(bucket)!;
    entry.totalImpressions += q.impressions;
    entry.weightedCtrSum += q.ctr * q.impressions;
    entry.count += 1;
  }

  const siteAvgCtrByPosition: Record<string, number> = {};
  const positionBuckets: number[] = [];

  for (const b of POSITION_BUCKETS) {
    const entry = bucketData.get(b);
    if (entry && entry.count >= 3 && entry.totalImpressions > 0) {
      siteAvgCtrByPosition[String(b)] = Number((entry.weightedCtrSum / entry.totalImpressions).toFixed(4));
      positionBuckets.push(b);
    } else {
      // Fallback to global
      siteAvgCtrByPosition[String(b)] = expectedCtrAtPosition(b);
    }
  }

  return {
    siteAvgCtrByPosition,
    positionBuckets,
    dataPoints: queries.length,
    computedAt,
    ctrBenchmarkSource: positionBuckets.length > 0 ? "site-specific" : "global-fallback",
  };
}

export function buildLostClickEstimateRows(
  queries: QueryMetric[],
  benchmark: CtrBenchmarkSummary
): LostClickEstimateRow[] {
  const rows: LostClickEstimateRow[] = [];
  for (const q of queries) {
    const bucket = positionToBucket(q.position);
    const benchmarkCtr = benchmark.siteAvgCtrByPosition[String(bucket)] ?? expectedCtrAtPosition(q.position);
    const estimatedLostClicks = q.impressions * Math.max(benchmarkCtr - q.ctr, 0);
    if (estimatedLostClicks <= 0) continue;
    rows.push({
      query: q.query,
      impressions: q.impressions,
      actualCtr: q.ctr,
      benchmarkCtr,
      positionBucket: bucket,
      estimatedLostClicks: Number(estimatedLostClicks.toFixed(2)),
      confidence: null,
      actionDetail: null,
    });
  }
  return clampRows(
    rows.sort((a, b) => b.estimatedLostClicks - a.estimatedLostClicks),
    20
  );
}

export function buildContentDecayRows(
  currentPages: PageMetric[],
  comparePages: PageMetric[],
  compareRangeEnd: string
): ContentDecayRow[] {
  const compareMap = new Map(comparePages.map((p) => [p.page, p]));
  const rows: ContentDecayRow[] = [];

  for (const page of currentPages) {
    const prev = compareMap.get(page.page);
    if (!prev || prev.clicks <= 50) continue;

    const decayRatio = page.clicks / prev.clicks;
    if (decayRatio >= 0.65) continue;

    const severity: ReportSectionPriority =
      decayRatio < 0.4 ? "KRITISCH" : decayRatio < 0.55 ? "HOCH" : "MITTEL";

    rows.push({
      page: page.page,
      peakClicks: prev.clicks,
      recentClicks: page.clicks,
      decayRatio: Number(decayRatio.toFixed(3)),
      peakDate: compareRangeEnd,
      estimatedLostClicks: prev.clicks - page.clicks,
      severity,
      actionDetail: null,
    });
  }

  return clampRows(
    rows.sort((a, b) => b.estimatedLostClicks - a.estimatedLostClicks),
    20
  );
}

export function twoProportionZTest(
  clicks1: number,
  impressions1: number,
  clicks2: number,
  impressions2: number
): { zScore: number; isSignificant: boolean; confidence: number } {
  if (impressions1 <= 0 || impressions2 <= 0) {
    return { zScore: 0, isSignificant: false, confidence: 0 };
  }
  const p1 = clicks1 / impressions1;
  const p2 = clicks2 / impressions2;
  const n1 = impressions1;
  const n2 = impressions2;
  const pPool = (clicks1 + clicks2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { zScore: 0, isSignificant: false, confidence: 0 };
  const z = Math.abs((p1 - p2) / se);
  return {
    zScore: Number(z.toFixed(3)),
    isSignificant: z >= 1.96,
    confidence: Number(Math.min(1, z / 2).toFixed(3)),
  };
}

function addSignificanceToWinnerLoserRows(rows: PageWinnerLoserRow[]): PageWinnerLoserRow[] {
  return rows.map((row) => {
    if (row.impressionsCurrent <= 0 || row.impressionsCompare <= 0) {
      return { ...row, isStatisticallySignificant: null, zScore: null };
    }
    const { zScore, isSignificant } = twoProportionZTest(
      row.clicksCurrent,
      row.impressionsCurrent,
      row.clicksCompare,
      row.impressionsCompare
    );
    return {
      ...row,
      isStatisticallySignificant: isSignificant,
      zScore,
    };
  });
}

function buildQueryOpportunitiesWithBenchmark(
  currentQueries: QueryMetric[],
  benchmark: CtrBenchmarkSummary
) {
  const enriched = currentQueries.map((q) => {
    const bucket = positionToBucket(q.position);
    const expectedCtr = benchmark.siteAvgCtrByPosition[String(bucket)] ?? expectedCtrAtPosition(q.position);
    const lostClicksEstimate = q.impressions * Math.max(expectedCtr - q.ctr, 0);
    return { ...q, expectedCtr, lostClicksEstimate };
  });

  const impressionMin = Math.min(...enriched.map((q) => q.impressions), 0);
  const impressionMax = Math.max(...enriched.map((q) => q.impressions), 1);
  const lostMin = Math.min(...enriched.map((q) => q.lostClicksEstimate), 0);
  const lostMax = Math.max(...enriched.map((q) => q.lostClicksEstimate), 1);

  return clampRows(
    enriched
      .map((q) => {
        const severityWeight = q.position >= 8 && q.position <= 20 ? 1 : q.position <= 7 ? 0.6 : 0.4;
        const opportunityScore =
          100 *
          (0.4 * normalize(q.impressions, impressionMin, impressionMax) +
            0.4 * normalize(q.lostClicksEstimate, lostMin, lostMax) +
            0.2 * severityWeight);

        return {
          query: q.query,
          clicks: q.clicks,
          impressions: q.impressions,
          ctr: q.ctr,
          position: q.position,
          expectedCtr: q.expectedCtr,
          lostClicksEstimate: Number(q.lostClicksEstimate.toFixed(2)),
          opportunityScore: Number(opportunityScore.toFixed(2)),
          recommendedAction:
            q.position > 10
              ? "Expand topical depth and strengthen internal links to this landing page"
              : "Rewrite title/meta and align snippet intent to improve CTR",
          confidence: null,
          actionDetail: null,
        } satisfies QueryOpportunityRow;
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore),
    50
  );
}

/**
 * Build all deterministic insights from raw GSC/GA4/crawl data.
 *
 * Input requirements:
 * - gscCurrent / gscCompare: GSC aggregate + topQueries + topPages for both periods
 * - ga4Current / ga4Compare: GA4 sessions/users (optional, can be null)
 * - crawl: CrawlResult with pages + issues (optional, can be null)
 * - siteChanges: pre-computed site change diff
 * - currentSeries / compareSeries: daily time series for KPI trend chart
 * - queryPagePairsCurrent: query-page pairs for cannibalization detection (optional)
 * - compareRangeEnd: ISO date string marking the end of the compare period (for decay peakDate)
 *
 * Output guarantees:
 * - All array fields are non-null (may be empty)
 * - opportunityScore values are in [0, 100]
 * - contentDecayRows only includes pages with decayRatio < 0.65 and compareClicks > 50
 * - pageWinnerLoserRows include z-test significance fields
 * - ctrBenchmarkSummary uses site-specific CTR when ≥ 10 queries are available
 * - schemaVersion in scoringMethodology reflects the current insight computation version
 */
export function buildDeterministicInsights(input: BuildDeterministicInsightsInput): DeterministicInsights {
  const kpiComparisonRows = buildKpiComparisonRows(input);
  const kpiTrendRows = buildKpiTrends(input);

  // Site-specific CTR benchmark (falls back to global when insufficient data)
  const ctrBenchmarkSummary = buildCtrBenchmarkCurve(input.gscCurrent.topQueries ?? []);

  // Use benchmark-aware query opportunities
  const queryOpportunityRows = buildQueryOpportunitiesWithBenchmark(
    input.gscCurrent.topQueries ?? [],
    ctrBenchmarkSummary
  );

  // Lost click estimates using site-specific benchmark
  const lostClickEstimateRows = buildLostClickEstimateRows(
    input.gscCurrent.topQueries ?? [],
    ctrBenchmarkSummary
  );

  // Page winners/losers with statistical significance
  const rawPageRows = buildPageWinnersLosers(
    input.gscCurrent.topPages ?? [],
    input.gscCompare.topPages ?? []
  );
  const pageWinnerLoserRows = addSignificanceToWinnerLoserRows(rawPageRows);

  const nearWinKeywordRows = buildNearWinKeywords(input.gscCurrent.topQueries ?? [], input.gscCurrent.topPages ?? []);
  const cannibalizationRows = buildCannibalization(input.queryPagePairsCurrent);
  const technicalIssueRows = buildTechnicalIssueRows(input.crawl, input.gscCurrent.topPages ?? []);
  const actionBacklogRows = buildActionBacklog({
    queryOpportunities: queryOpportunityRows,
    technicalIssues: technicalIssueRows,
    siteChanges: input.siteChanges,
  });

  // Content decay detection
  const compareRangeEnd = input.compareRangeEnd ?? new Date().toISOString().slice(0, 10);
  const contentDecayRows = buildContentDecayRows(
    input.gscCurrent.topPages ?? [],
    input.gscCompare.topPages ?? [],
    compareRangeEnd
  );

  // Alerts and flags summary
  const significantLosers = pageWinnerLoserRows
    .filter((r) => r.status === "loser" && r.isStatisticallySignificant === true)
    .map((r) => r.page);

  const alertsAndFlags: AlertsAndFlags = {
    contentDecayDetected: contentDecayRows.length > 0,
    significantLosers,
    cannibalizationCount: cannibalizationRows.length,
    criticalTechnicalIssues: technicalIssueRows.filter((r) => r.severity === "KRITISCH").length,
  };

  const scoringMethodology: ScoringMethodology = {
    ctrBenchmarkSource: ctrBenchmarkSummary.ctrBenchmarkSource,
    significanceTestUsed: true,
    decayWindowDays: 28,
    insightSchemaVersion: "2.0",
  };

  const clicksDelta = input.gscCurrent.clicks - input.gscCompare.clicks;
  const sessionsDelta = (input.ga4Current?.sessions ?? 0) - (input.ga4Compare?.sessions ?? 0);

  const executiveSummary = {
    headline: `Clicks ${clicksDelta >= 0 ? "up" : "down"} ${Math.abs(clicksDelta)} (${pct(
      clicksDelta,
      input.gscCompare.clicks
    )}), sessions ${sessionsDelta >= 0 ? "up" : "down"} ${Math.abs(sessionsDelta)} (${pct(
      sessionsDelta,
      input.ga4Compare?.sessions ?? 0
    )}).`,
    topActionAreas: [
      queryOpportunityRows[0]?.query ? `Unlock CTR opportunity for query \"${queryOpportunityRows[0].query}\"` : null,
      technicalIssueRows[0]?.issueType ? `Resolve technical issue pattern: ${technicalIssueRows[0].issueType}` : null,
      input.siteChanges.changedPages[0]?.url
        ? `Review performance impact of changed page ${input.siteChanges.changedPages[0].url}`
        : null,
    ].filter((value): value is string => Boolean(value)),
  };

  const workbookDataset: WorkbookDatasetV2 = {
    gscQueries: clampRows((input.gscCurrent.topQueries ?? []).map((q) => ({ ...q })), 500),
    gscPages: clampRows((input.gscCurrent.topPages ?? []).map((p) => ({ ...p })), 500),
    gaChannels: clampRows((input.ga4Current?.trafficSources ?? []).map((row) => ({ ...row })), 500),
    gaLandingPages: clampRows((input.ga4Current?.landingPages ?? []).map((row) => ({ ...row })), 500),
  };

  return {
    kpiComparisonRows,
    kpiTrendRows,
    queryOpportunityRows,
    pageWinnerLoserRows,
    nearWinKeywordRows,
    cannibalizationRows,
    technicalIssueRows,
    actionBacklogRows,
    workbookDataset,
    executiveSummary,
    contentDecayRows,
    lostClickEstimateRows,
    ctrBenchmarkSummary,
    alertsAndFlags,
    scoringMethodology,
  };
}

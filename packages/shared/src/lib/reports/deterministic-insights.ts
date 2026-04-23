import type {
  ActionBacklogRow,
  AlertsAndFlags,
  CannibalizationRow,
  ContentDecayRow,
  CtrBenchmarkSummary,
  KpiTrendRow,
  LostClickEstimateRow,
  NotRecommendedRow,
  NearWinKeywordRow,
  PageWinnerLoserRow,
  QueryOpportunityRow,
  RecommendationClass,
  RecommendationConfidenceLabel,
  RecommendationDetail,
  RecommendationEffort,
  RecommendationExpectedDirection,
  RecommendationOwner,
  RecommendationPrimaryMetric,
  RecommendationSuccessWindow,
  RecommendationTimeToValue,
  RecommendationValueAtStake,
  ReportSectionPriority,
  ScoringMethodology,
  SiteChanges,
  TechnicalIssueRow,
  WeeklyActionRow,
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
  weeklyActionRows: WeeklyActionRow[];
  notRecommendedRows: NotRecommendedRow[];
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

function formatInteger(value: number) {
  return Math.round(value).toLocaleString();
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function confidenceFromSignals(signalCount: number): RecommendationConfidenceLabel {
  if (signalCount >= 3) return "high";
  if (signalCount >= 2) return "medium";
  return "exploratory";
}

function confidenceScore(label: RecommendationConfidenceLabel) {
  if (label === "high") return 0.9;
  if (label === "medium") return 0.7;
  return 0.45;
}

function buildDetail(input: RecommendationDetail): RecommendationDetail {
  return input;
}

function classBiasValue(recommendationClass: RecommendationClass) {
  if (recommendationClass === "protect") return 3;
  if (recommendationClass === "lift") return 2;
  return 1;
}

function timeToValueWeight(value: RecommendationTimeToValue) {
  if (value === "days") return 3;
  if (value === "weeks") return 2;
  return 1;
}

function effortWeight(value: RecommendationEffort) {
  if (value === "XS") return 4;
  if (value === "S") return 3;
  if (value === "M") return 2;
  return 1;
}

function primaryStakeValue(valueAtStake: RecommendationValueAtStake) {
  return Math.max(
    valueAtStake.clicksAtRisk ?? 0,
    valueAtStake.recoveryPotential ?? 0,
    valueAtStake.nearWinOpportunity ?? 0,
    valueAtStake.trafficExposure ?? 0,
  );
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
      .map((q) => {
        const detail = buildDetail({
          observed: [
            `"${q.query}" ranks at ${q.position.toFixed(1)} with ${formatInteger(q.impressions)} impressions.`,
            `Current CTR is ${formatPercent(q.ctr)} from ${formatInteger(q.clicks)} clicks.`,
          ],
          likelyCauses: [
            q.position > 10
              ? "The page is close to page one but likely under-covers the query intent."
              : "The page ranks within reach but is probably missing support for related subtopics or snippet demand.",
          ],
          recommendedActions: [
            landing
              ? `Update ${landing} to address the exact query intent for "${q.query}".`
              : `Update the mapped landing page to address the exact query intent for "${q.query}".`,
            `Add one supporting FAQ or subsection that mirrors the query language.`,
            "Strengthen internal links from relevant high-traffic pages pointing to this target.",
          ],
          whyThisHelps: [
            "Better intent coverage can improve relevance for a page already within striking distance.",
            "Internal links concentrate supporting signals on the page that should rank for this term.",
          ],
          expectedOutcome: [
            "A stronger page-one push on this query should show as ranking improvement before large click gains.",
            "The earliest visible win is movement from low page-two positions toward page one.",
          ],
          evidence: {
            deterministic: [
              { label: "Keyword", value: q.query },
              { label: "Position", value: q.position.toFixed(1) },
              { label: "Impressions", value: formatInteger(q.impressions) },
              { label: "Clicks", value: formatInteger(q.clicks) },
            ],
            inferred: ["Likely intent or coverage gap on the ranking page."],
          },
        });

        return {
          keyword: q.query,
          position: q.position,
          impressions: q.impressions,
          clicks: q.clicks,
          ctr: q.ctr,
          targetLandingPage: landing,
          action: "Improve on-page relevance and add supporting FAQ/section for this query",
          actionDetail: detail,
        } satisfies NearWinKeywordRow;
      }),
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
      actionDetail: buildDetail({
        observed: [
          `"${query}" is split across ${distinctPages.length} pages.`,
          `${formatInteger(totalClicks)} clicks and ${formatInteger(totalImpressions)} impressions are spread across competing URLs.`,
        ],
        likelyCauses: [
          "Google is receiving mixed signals about which page should be the primary result for this term.",
        ],
        recommendedActions: [
          `Choose one primary page for "${query}" and align internal links to it.`,
          "Reduce exact-match optimization on secondary pages or consolidate overlapping content.",
        ],
        whyThisHelps: [
          "Consolidation helps search engines assign authority and intent to one URL instead of splitting it.",
        ],
        expectedOutcome: [
          "The first visible win is less ranking volatility between competing pages for the same term.",
        ],
        evidence: {
          deterministic: [
            { label: "Query", value: query },
            { label: "Competing pages", value: String(distinctPages.length) },
            { label: "Total clicks", value: formatInteger(totalClicks) },
            { label: "Total impressions", value: formatInteger(totalImpressions) },
          ],
          inferred: ["Likely cannibalization due to overlapping intent coverage."],
        },
      }),
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
      recommendation:
        issueType.toLowerCase().includes("broken")
          ? "Fix the broken-link pattern on the affected pages before spending time on net-new SEO work."
          : "Fix the template or component pattern behind this issue before page-by-page edits.",
    };
  });

  return clampRows(rows.sort((a, b) => b.affectedEstimatedClicks - a.affectedEstimatedClicks), 40);
}

function buildActionBacklog(weeklyActions: WeeklyActionRow[]) {
  return weeklyActions.map((row) => ({
    id: row.id,
    area: row.area,
    task: row.title,
    ownerHint:
      row.owner === "decision_maker"
        ? "marketing"
        : row.owner,
    effort: row.effort === "XS" ? "S" : row.effort,
    impactScore: primaryStakeValue(row.valueAtStake),
    why: row.whyNow,
    done: false,
    actionDetail: row.detail,
  })) satisfies ActionBacklogRow[];
}

type WeeklyCandidate = Omit<WeeklyActionRow, "rank" | "priorityReason"> & {
  priorityReason?: string;
};

function buildPriorityReason(input: {
  recommendationClass: RecommendationClass;
  valueAtStake: RecommendationValueAtStake;
  confidenceLabel: RecommendationConfidenceLabel;
  timeToValue: RecommendationTimeToValue;
}) {
  const primaryValue = primaryStakeValue(input.valueAtStake);
  const classText =
    input.recommendationClass === "protect"
      ? "protects proven value"
      : input.recommendationClass === "lift"
        ? "lifts an asset that already performs"
        : "expands into new upside";

  return `${classText}; about ${formatInteger(primaryValue)} clicks are plausibly in play with ${input.confidenceLabel} confidence and a ${input.timeToValue} time to first visible movement.`;
}

function rankWeeklyActions(candidates: WeeklyCandidate[]) {
  const sorted = [...candidates].sort((a, b) => {
    const classDelta = classBiasValue(b.recommendationClass) - classBiasValue(a.recommendationClass);
    if (classDelta !== 0) return classDelta;

    const stakeDelta = primaryStakeValue(b.valueAtStake) - primaryStakeValue(a.valueAtStake);
    if (stakeDelta !== 0) return stakeDelta;

    const confidenceDelta = confidenceScore(b.confidenceLabel) - confidenceScore(a.confidenceLabel);
    if (confidenceDelta !== 0) return confidenceDelta;

    const timeDelta = timeToValueWeight(b.timeToValue) - timeToValueWeight(a.timeToValue);
    if (timeDelta !== 0) return timeDelta;

    return effortWeight(b.effort) - effortWeight(a.effort);
  });

  return sorted.map((candidate, index) => ({
    ...candidate,
    rank: index + 1,
    priorityReason:
      candidate.priorityReason ??
      buildPriorityReason({
        recommendationClass: candidate.recommendationClass,
        valueAtStake: candidate.valueAtStake,
        confidenceLabel: candidate.confidenceLabel,
        timeToValue: candidate.timeToValue,
      }),
  })) satisfies WeeklyActionRow[];
}

function makeTechnicalCandidate(row: TechnicalIssueRow, index: number): WeeklyCandidate | null {
  if (row.affectedEstimatedClicks <= 0 && row.affectedPages < 2) return null;

  const confidenceLabel = confidenceFromSignals(
    (row.affectedPages >= 2 ? 1 : 0) +
      (row.affectedEstimatedClicks > 0 ? 1 : 0) +
      (row.severity === "KRITISCH" || row.severity === "HOCH" ? 1 : 0),
  );

  const title =
    row.issueType.toLowerCase().includes("broken")
      ? `Fix ${row.affectedPages} broken internal-link issues on traffic-carrying pages`
      : `Fix ${row.issueType.toLowerCase()} affecting ${row.affectedPages} pages`;

  return {
    id: `weekly_tech_${index + 1}`,
    area: "technical",
    title,
    whyNow: `${row.affectedPages} pages are affected and about ${formatInteger(row.affectedEstimatedClicks)} clicks are exposed if the issue stays unresolved.`,
    recommendationClass: "protect",
    primaryMetric: "crawl_health",
    expectedDirection: "recover",
    successWindow: "0-7d",
    successSignal: "Affected pages no longer show the blocking technical issue on the next validation crawl.",
    timeToValue: "days",
    firstVisibleWin: row.issueType.toLowerCase().includes("broken")
      ? "The blocker should disappear as soon as the links or redirects validate."
      : "The technical issue count should drop on the next validation crawl.",
    valueAtStake: {
      clicksAtRisk: row.affectedEstimatedClicks,
      trafficExposure: row.affectedEstimatedClicks,
    },
    confidenceLabel,
    confidenceScore: confidenceScore(confidenceLabel),
    confidenceBasis: `${row.affectedPages} affected pages and ${formatInteger(row.affectedEstimatedClicks)} estimated clicks are directly observable.`,
    owner: "developer",
    effort: row.affectedPages > 10 ? "L" : row.affectedPages > 4 ? "M" : "S",
    targetPage: null,
    supportingQueries: [],
    detail: buildDetail({
      observed: [
        `${row.issueType} affects ${row.affectedPages} pages.`,
        `Those pages account for about ${formatInteger(row.affectedEstimatedClicks)} estimated clicks.`,
      ],
      likelyCauses: [
        "The issue likely comes from a shared template, component, or repeated content pattern.",
      ],
      recommendedActions: [
        row.recommendation,
        "Validate the affected pages after the fix instead of assuming the pattern is resolved.",
      ],
      whyThisHelps: [
        "Removing technical blockers prevents crawl loss and protects user journeys on pages that already attract demand.",
      ],
      expectedOutcome: [
        "The first visible win is a clean validation crawl with the issue removed.",
        "Success is fewer blocked pages and preserved click volume on the affected URLs.",
      ],
      evidence: {
        deterministic: [
          { label: "Issue type", value: row.issueType },
          { label: "Affected pages", value: String(row.affectedPages) },
          { label: "Estimated clicks at risk", value: formatInteger(row.affectedEstimatedClicks) },
          { label: "Severity", value: row.severity },
        ],
        inferred: ["Likely recurring implementation issue rather than a one-off page problem."],
      },
    }),
  };
}

function makeContentDecayCandidate(row: ContentDecayRow, index: number): WeeklyCandidate | null {
  if (row.estimatedLostClicks < 50) return null;

  const confidenceLabel = confidenceFromSignals(3);
  return {
    id: `weekly_decay_${index + 1}`,
    area: "content",
    title: `Refresh decaying page ${row.page}`,
    whyNow: `${row.page} has already lost about ${formatInteger(row.estimatedLostClicks)} clicks from a previously proven baseline.`,
    recommendationClass: "protect",
    primaryMetric: "clicks",
    expectedDirection: "recover",
    successWindow: "14-42d",
    successSignal: "Target page trend turns positive versus the prior 28-day baseline after the refresh is indexed.",
    timeToValue: "weeks",
    firstVisibleWin: "The decline should flatten before the page starts recovering clicks.",
    valueAtStake: {
      clicksAtRisk: row.estimatedLostClicks,
      recoveryPotential: row.estimatedLostClicks,
      trafficExposure: row.peakClicks,
    },
    confidenceLabel,
    confidenceScore: confidenceScore(confidenceLabel),
    confidenceBasis: `The page shows a clear baseline drop from ${formatInteger(row.peakClicks)} to ${formatInteger(row.recentClicks)} clicks.`,
    owner: "content",
    effort: row.estimatedLostClicks > 250 ? "M" : "S",
    targetPage: row.page,
    supportingQueries: [],
    detail: row.actionDetail ?? buildDetail({
      observed: [],
      likelyCauses: [],
      recommendedActions: [],
      whyThisHelps: [],
      expectedOutcome: [],
      evidence: { deterministic: [], inferred: [] },
    }),
  };
}

function makeCtrLiftCandidate(row: LostClickEstimateRow, index: number): WeeklyCandidate | null {
  if (row.estimatedLostClicks < 40) return null;

  const confidenceLabel = confidenceFromSignals(3);
  return {
    id: `weekly_ctr_${index + 1}`,
    area: "onpage",
    title: `Lift CTR for "${row.query}"`,
    whyNow: `${formatInteger(row.estimatedLostClicks)} clicks are available without needing net-new rankings if the snippet improves.`,
    recommendationClass: "lift",
    primaryMetric: "ctr",
    expectedDirection: "improve",
    successWindow: "7-21d",
    successSignal: "Target query CTR improves versus the prior 28-day baseline after recrawl and snippet refresh.",
    timeToValue: "days",
    firstVisibleWin: "CTR improvement may appear after recrawl and snippet update.",
    valueAtStake: {
      nearWinOpportunity: row.estimatedLostClicks,
      trafficExposure: row.impressions,
    },
    confidenceLabel,
    confidenceScore: confidenceScore(confidenceLabel),
    confidenceBasis: `High impression volume and a measurable CTR gap versus the benchmark support this recommendation.`,
    owner: "seo",
    effort: row.estimatedLostClicks > 150 ? "S" : "XS",
    targetPage: null,
    supportingQueries: [row.query],
    detail: row.actionDetail ?? buildDetail({
      observed: [],
      likelyCauses: [],
      recommendedActions: [],
      whyThisHelps: [],
      expectedOutcome: [],
      evidence: { deterministic: [], inferred: [] },
    }),
  };
}

function makeNearWinCandidate(row: NearWinKeywordRow, index: number): WeeklyCandidate | null {
  const opportunity = row.estimatedImpact ?? row.impressions * 0.04;
  if (opportunity < 40) return null;

  const confidenceLabel = confidenceFromSignals(row.targetLandingPage ? 3 : 2);
  return {
    id: `weekly_near_${index + 1}`,
    area: "content",
    title: `Push "${row.keyword}" onto page one`,
    whyNow: `"${row.keyword}" already has ${formatInteger(row.impressions)} impressions and sits close enough to benefit from focused work.`,
    recommendationClass: "lift",
    primaryMetric: "rankings",
    expectedDirection: "improve",
    successWindow: "14-42d",
    successSignal: "Target query moves closer to or onto page one against the prior 28-day baseline.",
    timeToValue: "weeks",
    firstVisibleWin: "Ranking movement should appear before full click gains.",
    valueAtStake: {
      nearWinOpportunity: opportunity,
      trafficExposure: row.impressions,
    },
    confidenceLabel,
    confidenceScore: confidenceScore(confidenceLabel),
    confidenceBasis: `Position ${row.position.toFixed(1)} and ${formatInteger(row.impressions)} impressions indicate reachable upside.`,
    owner: row.targetLandingPage?.includes("/blog/") ? "content" : "seo",
    effort: row.position > 12 ? "M" : "S",
    targetPage: row.targetLandingPage ?? null,
    supportingQueries: [row.keyword],
    detail: row.actionDetail ?? buildDetail({
      observed: [],
      likelyCauses: [],
      recommendedActions: [],
      whyThisHelps: [],
      expectedOutcome: [],
      evidence: { deterministic: [], inferred: [] },
    }),
  };
}

function makeCannibalizationCandidate(row: CannibalizationRow, index: number): WeeklyCandidate | null {
  if (row.totalClicks < 50) return null;

  const confidenceLabel = confidenceFromSignals(3);
  return {
    id: `weekly_cannibal_${index + 1}`,
    area: "content",
    title: `Consolidate cannibalization for "${row.query}"`,
    whyNow: `${formatInteger(row.totalClicks)} clicks are being split across ${row.pages.length} competing pages.`,
    recommendationClass: "protect",
    primaryMetric: "rankings",
    expectedDirection: "recover",
    successWindow: "14-42d",
    successSignal: "One primary URL becomes the consistent ranking result for the target query.",
    timeToValue: "weeks",
    firstVisibleWin: "Ranking volatility between competing pages should reduce first.",
    valueAtStake: {
      recoveryPotential: row.totalClicks,
      trafficExposure: row.totalImpressions,
    },
    confidenceLabel,
    confidenceScore: confidenceScore(confidenceLabel),
    confidenceBasis: `The same query is measurably split across multiple pages in the current data.`,
    owner: "seo",
    effort: row.pages.length > 2 ? "M" : "S",
    targetPage: row.pages[0] ?? null,
    supportingQueries: [row.query],
    detail: row.actionDetail ?? buildDetail({
      observed: [],
      likelyCauses: [],
      recommendedActions: [],
      whyThisHelps: [],
      expectedOutcome: [],
      evidence: { deterministic: [], inferred: [] },
    }),
  };
}

function buildWeeklyActionRows(input: {
  technicalIssues: TechnicalIssueRow[];
  contentDecayRows: ContentDecayRow[];
  lostClickEstimateRows: LostClickEstimateRow[];
  nearWinKeywordRows: NearWinKeywordRow[];
  cannibalizationRows: CannibalizationRow[];
}) {
  const candidates = [
    ...input.technicalIssues.slice(0, 4).map(makeTechnicalCandidate),
    ...input.contentDecayRows.slice(0, 3).map(makeContentDecayCandidate),
    ...input.lostClickEstimateRows.slice(0, 3).map(makeCtrLiftCandidate),
    ...input.nearWinKeywordRows.slice(0, 3).map(makeNearWinCandidate),
    ...input.cannibalizationRows.slice(0, 2).map(makeCannibalizationCandidate),
  ].filter((value): value is WeeklyCandidate => value !== null);

  return clampRows(rankWeeklyActions(candidates), 8);
}

function buildNotRecommendedRows(input: {
  contentDecayRows: ContentDecayRow[];
  technicalIssues: TechnicalIssueRow[];
  nearWinKeywordRows: NearWinKeywordRow[];
}) {
  const rows: NotRecommendedRow[] = [];

  if (input.contentDecayRows.length > 0) {
    rows.push({
      id: "not_recommended_expand_content",
      area: "content",
      title: "Publish net-new topic content this week",
      recommendationClass: "expand",
      primaryMetric: "coverage",
      expectedDirection: "expand",
      successWindow: "30-90d",
      successSignal: "New content begins earning impressions on target topic clusters.",
      timeToValue: "months",
      firstVisibleWin: "New pages may take weeks before meaningful impression growth appears.",
      valueAtStake: {
        trafficExposure: input.contentDecayRows[0]?.peakClicks ?? 0,
      },
      confidenceLabel: "high",
      confidenceScore: confidenceScore("high"),
      confidenceBasis: "Existing decaying pages already show recoverable value and should be protected before expansion work.",
      owner: "content",
      effort: "M",
      priorityReason: "Protecting proven value outranks expansion work this week.",
      notRecommendedReason: "Do not publish net-new content before refreshing decaying high-authority pages with proven traffic.",
      targetPage: null,
      supportingQueries: [],
      detail: buildDetail({
        observed: [
          "At least one proven page is already losing meaningful traffic.",
        ],
        likelyCauses: [
          "New content would delay recovery work on assets that already have authority and search demand.",
        ],
        recommendedActions: [
          "Refresh the decaying page first and validate recovery before expanding into adjacent topics.",
        ],
        whyThisHelps: [
          "Recovery work usually yields faster, more believable wins than starting from zero.",
        ],
        expectedOutcome: [
          "Opportunity cost is reduced by fixing proven assets before creating new ones.",
        ],
        evidence: {
          deterministic: [
            { label: "Decaying pages", value: String(input.contentDecayRows.length) },
          ],
          inferred: ["Expansion would compete for time against higher-confidence recovery work."],
        },
      }),
    });
  }

  if (input.technicalIssues.length > 0) {
    rows.push({
      id: "not_recommended_backlinks",
      area: "technical",
      title: "Start backlink outreach before on-page blockers are fixed",
      recommendationClass: "expand",
      primaryMetric: "coverage",
      expectedDirection: "expand",
      successWindow: "30-90d",
      successSignal: "New referral or authority signals begin appearing for target pages.",
      timeToValue: "months",
      firstVisibleWin: "Outreach rarely produces visible SEO movement in the same week.",
      valueAtStake: {
        clicksAtRisk: input.technicalIssues[0]?.affectedEstimatedClicks ?? 0,
      },
      confidenceLabel: "high",
      confidenceScore: confidenceScore("high"),
      confidenceBasis: "Technical blockers are already measurable on existing traffic-carrying pages.",
      owner: "seo",
      effort: "M",
      priorityReason: "Removing blockers on existing pages outranks slower authority-building work.",
      notRecommendedReason: "Do not start backlink outreach before existing on-page or technical blockers are resolved.",
      targetPage: null,
      supportingQueries: [],
      detail: buildDetail({
        observed: ["Existing technical issues are unresolved on pages already carrying traffic."],
        likelyCauses: ["Authority work will underperform while basic blockers remain unresolved."],
        recommendedActions: ["Fix the blocker first, then invest in authority-building or outreach."],
        whyThisHelps: ["It prevents spending effort on growth work that lands on weak pages."],
        expectedOutcome: ["The team avoids slower, lower-confidence work while higher-confidence fixes remain open."],
        evidence: {
          deterministic: [
            { label: "Technical issue patterns", value: String(input.technicalIssues.length) },
          ],
          inferred: ["Basic page health should be addressed before amplification work."],
        },
      }),
    });
  }

  if (input.nearWinKeywordRows.length > 0) {
    rows.push({
      id: "not_recommended_low_impression_cleanup",
      area: "onpage",
      title: "Prioritize low-impression cleanup ahead of near-win gains",
      recommendationClass: "expand",
      primaryMetric: "coverage",
      expectedDirection: "expand",
      successWindow: "30-90d",
      successSignal: "Low-volume pages show small quality improvements with limited traffic effect.",
      timeToValue: "months",
      firstVisibleWin: "The work may finish quickly, but meaningful search movement is unlikely to be visible soon.",
      valueAtStake: {
        nearWinOpportunity: input.nearWinKeywordRows[0]?.estimatedImpact ?? input.nearWinKeywordRows[0]?.impressions ?? 0,
      },
      confidenceLabel: "medium",
      confidenceScore: confidenceScore("medium"),
      confidenceBasis: "Existing near-win opportunities have clearer upside than low-volume cleanup.",
      owner: "seo",
      effort: "S",
      priorityReason: "Reachable upside on existing near-win terms is more valuable than low-volume hygiene work.",
      notRecommendedReason: "Do not prioritize low-impression cleanup ahead of near-win keywords already close to page one.",
      targetPage: null,
      supportingQueries: [],
      detail: buildDetail({
        observed: ["The report already includes near-win terms with meaningful impressions."],
        likelyCauses: ["Low-volume cleanup would consume effort without comparable upside."],
        recommendedActions: ["Push near-win keywords first, then return to lower-leverage cleanup."],
        whyThisHelps: ["It keeps weekly effort on the clearest upside with the fastest believable win."],
        expectedOutcome: ["The team avoids backlog expansion that does not move the weekly decision needle."],
        evidence: {
          deterministic: [
            { label: "Near-win keywords", value: String(input.nearWinKeywordRows.length) },
          ],
          inferred: ["Higher-leverage opportunities exist and should be addressed before low-volume cleanup."],
        },
      }),
    });
  }

  return clampRows(rows, 3);
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
      confidence: Number(Math.min(0.95, 0.55 + Math.min(estimatedLostClicks / 300, 0.35)).toFixed(2)),
      actionDetail: buildDetail({
        observed: [
          `"${q.query}" gets ${formatInteger(q.impressions)} impressions with ${formatPercent(q.ctr)} CTR.`,
          `Expected CTR for position bucket ${bucket} is ${formatPercent(benchmarkCtr)}.`,
        ],
        likelyCauses: [
          q.position <= 8
            ? "The page already ranks, but the snippet likely undersells the result."
            : "The query likely needs both ranking support and better snippet alignment.",
        ],
        recommendedActions: [
          `Rewrite title and meta copy for the page ranking on "${q.query}" to match the searcher's intent.`,
          "Add one snippet-worthy proof point such as pricing, freshness, or a trust signal if the page supports it.",
        ],
        whyThisHelps: [
          "CTR gains are easiest when the page already appears often enough to earn impressions.",
        ],
        expectedOutcome: [
          "The first visible win is higher CTR after recrawl and snippet refresh.",
          "Click gains should show against the prior 28-day baseline for this query set.",
        ],
        evidence: {
          deterministic: [
            { label: "Query", value: q.query },
            { label: "Impressions", value: formatInteger(q.impressions) },
            { label: "Actual CTR", value: formatPercent(q.ctr) },
            { label: "Benchmark CTR", value: formatPercent(benchmarkCtr) },
            { label: "Estimated lost clicks", value: formatInteger(estimatedLostClicks) },
          ],
          inferred: ["Likely snippet or SERP-message gap versus peers in the same position range."],
        },
      }),
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
      actionDetail: buildDetail({
        observed: [
          `${page.page} fell from ${formatInteger(prev.clicks)} clicks to ${formatInteger(page.clicks)} clicks.`,
          `This is a ${((1 - decayRatio) * 100).toFixed(0)}% decline compared with the prior baseline.`,
        ],
        likelyCauses: [
          "The page has likely lost freshness or breadth against newer competing content.",
        ],
        recommendedActions: [
          `Refresh ${page.page} with current-year references and updated facts.`,
          "Add one new section or FAQ set targeting related long-tail demand before publishing anything net new.",
        ],
        whyThisHelps: [
          "Refreshing proven content is usually faster than earning traction on a new page from zero.",
        ],
        expectedOutcome: [
          "The first visible win is stabilization of the declining trend before full recovery.",
          "Success should show as a positive trend versus the prior 28-day baseline for this page.",
        ],
        evidence: {
          deterministic: [
            { label: "Page", value: page.page },
            { label: "Peak clicks", value: formatInteger(prev.clicks) },
            { label: "Recent clicks", value: formatInteger(page.clicks) },
            { label: "Estimated clicks lost", value: formatInteger(prev.clicks - page.clicks) },
            { label: "Baseline period end", value: compareRangeEnd },
          ],
          inferred: ["Likely freshness or coverage decay on a once-proven page."],
        },
      }),
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
          confidence: Number(Math.min(0.92, 0.5 + normalize(q.lostClicksEstimate, lostMin, lostMax) * 0.3 + severityWeight * 0.15).toFixed(2)),
          actionDetail: buildDetail({
            observed: [
              `"${q.query}" has ${formatInteger(q.impressions)} impressions at position ${q.position.toFixed(1)}.`,
              `Estimated lost clicks versus the benchmark are ${formatInteger(q.lostClicksEstimate)}.`,
            ],
            likelyCauses: [
              q.position > 10
                ? "The page is near page one but likely under-serves the query intent."
                : "The query likely needs a stronger snippet promise to convert existing impressions.",
            ],
            recommendedActions: [
              q.position > 10
                ? `Expand the landing page coverage for "${q.query}" and reinforce it with internal links.`
                : `Rewrite the title and meta message for the ranking page targeting "${q.query}".`,
            ],
            whyThisHelps: [
              "The page already has search exposure, so focused improvements can move results faster than starting new content.",
            ],
            expectedOutcome: [
              "The first visible win is a ranking lift or CTR improvement on the target query before broader traffic gains.",
            ],
            evidence: {
              deterministic: [
                { label: "Query", value: q.query },
                { label: "Position", value: q.position.toFixed(1) },
                { label: "Impressions", value: formatInteger(q.impressions) },
                { label: "Estimated lost clicks", value: formatInteger(q.lostClicksEstimate) },
              ],
              inferred: ["Likely intent mismatch or snippet weakness, depending on the ranking range."],
            },
          }),
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

  // Content decay detection
  const compareRangeEnd = input.compareRangeEnd ?? new Date().toISOString().slice(0, 10);
  const contentDecayRows = buildContentDecayRows(
    input.gscCurrent.topPages ?? [],
    input.gscCompare.topPages ?? [],
    compareRangeEnd
  );

  const weeklyActionRows = buildWeeklyActionRows({
    technicalIssues: technicalIssueRows,
    contentDecayRows,
    lostClickEstimateRows,
    nearWinKeywordRows,
    cannibalizationRows,
  });
  const notRecommendedRows = buildNotRecommendedRows({
    contentDecayRows,
    technicalIssues: technicalIssueRows,
    nearWinKeywordRows,
  });
  const actionBacklogRows = buildActionBacklog(weeklyActionRows);

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
    topActionAreas: weeklyActionRows.slice(0, 3).map((row) => row.title),
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
    weeklyActionRows,
    notRecommendedRows,
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

export type ReportSectionPriority = "KRITISCH" | "HOCH" | "MITTEL" | "NIEDRIG";

export type AiSeoReportMetadata = {
  language: string;
  schemaVersion: string;
  reportTitle: string;
  periodLabel: string;
  createdAtIso: string;
  notes?: string[];
};

export type KpiComparisonRow = {
  metric: string;
  previous: string;
  current: string;
  delta: string;
  assessment: string;
};

export type ContentAuditRow = {
  page: string;
  currentState: string;
  problem: string;
  recommendation: string;
  keywordPotential: string;
  effort: string;
  priority: ReportSectionPriority;
  estimatedImpact?: number | null;
  actionDetail?: string | null;
  refreshStrategy?: string | null;
};

export type KeywordLandingpageRow = {
  keyword: string;
  impressions: string;
  currentPosition: string;
  currentLandingpage: string;
  recommendedLandingpage: string;
  missingContent: string;
  priority: ReportSectionPriority;
};

export type FaqPlanRow = {
  category: string;
  question: string;
  targetKeyword: string;
  priority: ReportSectionPriority;
};

export type TechnicalQuickWinRow = {
  index: number;
  measure: string;
  problem: string;
  solution: string;
  effort: string;
  impact: "KRITISCH" | "HOCH" | "MITTEL" | "NIEDRIG";
};

export type ActionPlanRow = {
  phase: string;
  week: string;
  measure: string;
  description: string;
  owner: string;
  status: string;
};

export type ClientChecklistRow = {
  index: number;
  requiredItem: string;
  description: string;
  forPhase: string;
  status: string;
};

export type SiteChangeEntry = {
  url: string;
  changedFields?: string[];
  machineDiffSummary?: string;
};

export type SiteChanges = {
  newPages: SiteChangeEntry[];
  changedPages: SiteChangeEntry[];
  removedPages: SiteChangeEntry[];
};

export type KpiTrendRow = {
  date: string;
  clicksCurrent: number;
  clicksCompare: number;
  impressionsCurrent: number;
  impressionsCompare: number;
  ctrCurrent: number;
  ctrCompare: number;
  positionCurrent: number;
  positionCompare: number;
  sessionsCurrent?: number;
  sessionsCompare?: number;
  usersCurrent?: number;
  usersCompare?: number;
};

export type QueryOpportunityRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  expectedCtr: number;
  lostClicksEstimate: number;
  opportunityScore: number;
  recommendedAction: string;
  confidence?: number | null;
  actionDetail?: string | null;
};

export type PageWinnerLoserRow = {
  page: string;
  clicksCurrent: number;
  clicksCompare: number;
  clicksDelta: number;
  impressionsCurrent: number;
  impressionsCompare: number;
  impressionsDelta: number;
  status: "winner" | "loser" | "flat";
  isStatisticallySignificant?: boolean | null;
  zScore?: number | null;
  actionDetail?: string | null;
};

export type NearWinKeywordRow = {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  targetLandingPage?: string;
  action: string;
  estimatedImpact?: number | null;
  actionDetail?: string | null;
};

export type CannibalizationRow = {
  query: string;
  pages: string[];
  totalClicks: number;
  totalImpressions: number;
  recommendation: string;
};

export type TechnicalIssueRow = {
  issueType: string;
  affectedPages: number;
  affectedEstimatedClicks: number;
  severity: "KRITISCH" | "HOCH" | "MITTEL" | "NIEDRIG";
  recommendation: string;
};

export type ActionBacklogRow = {
  id: string;
  area: "technical" | "content" | "onpage" | "analytics";
  task: string;
  ownerHint: "developer" | "seo" | "content" | "marketing";
  effort: "S" | "M" | "L";
  impactScore: number;
  why: string;
  done: boolean;
};

export type ContentDecayRow = {
  page: string;
  peakClicks: number;
  recentClicks: number;
  decayRatio: number;
  peakDate: string;
  estimatedLostClicks: number;
  severity: ReportSectionPriority;
  actionDetail: string | null;
};

export type LostClickEstimateRow = {
  query: string;
  impressions: number;
  actualCtr: number;
  benchmarkCtr: number;
  positionBucket: number;
  estimatedLostClicks: number;
  confidence: number | null;
  actionDetail: string | null;
};

export type CtrBenchmarkSummary = {
  siteAvgCtrByPosition: Record<string, number>;
  positionBuckets: number[];
  dataPoints: number;
  computedAt: string;
  ctrBenchmarkSource: "site-specific" | "global-fallback";
};

export type AlertsAndFlags = {
  contentDecayDetected: boolean;
  significantLosers: string[];
  cannibalizationCount: number;
  criticalTechnicalIssues: number;
};

export type ScoringMethodology = {
  ctrBenchmarkSource: "site-specific" | "global-fallback";
  significanceTestUsed: boolean;
  decayWindowDays: number;
  insightSchemaVersion: string;
};

export type WorkbookDatasetV2 = {
  gscQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  gscPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
  }>;
  gaChannels: Array<{
    medium: string;
    sessions: number;
    users: number;
  }>;
  gaLandingPages: Array<{
    landingPage: string;
    sessions: number;
    pageviews: number;
  }>;
};

export type AiSeoReport = {
  metadata: AiSeoReportMetadata;
  dashboardMarkdown: string;
  executiveSummary: {
    headline: string;
    topActionAreas: string[];
  };
  kpiComparisonRows: KpiComparisonRow[];
  contentAuditRows: ContentAuditRow[];
  keywordLandingpageRows: KeywordLandingpageRow[];
  faqPlanRows: FaqPlanRow[];
  technicalQuickWinRows: TechnicalQuickWinRow[];
  actionPlanRows: ActionPlanRow[];
  clientChecklistRows: ClientChecklistRow[];
  siteChanges?: SiteChanges;
  kpiTrendRows?: KpiTrendRow[];
  queryOpportunityRows?: QueryOpportunityRow[];
  pageWinnerLoserRows?: PageWinnerLoserRow[];
  nearWinKeywordRows?: NearWinKeywordRow[];
  cannibalizationRows?: CannibalizationRow[];
  technicalIssueRows?: TechnicalIssueRow[];
  actionBacklogRows?: ActionBacklogRow[];
  workbookDataset?: WorkbookDatasetV2;
  contentDecayRows?: ContentDecayRow[] | null;
  lostClickEstimateRows?: LostClickEstimateRow[] | null;
  alertsAndFlags?: AlertsAndFlags | null;
  scoringMethodology?: ScoringMethodology | null;
};

export type AiOutputStrategyName = "json_schema" | "tool_strict";

export type OpenAIRequestTrace = {
  phase: string;
  xRequestId?: string | null;
  xClientRequestId: string;
};

export type AiUsageSnapshot = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
  reasoningTokens?: number;
  raw?: Record<string, unknown>;
};

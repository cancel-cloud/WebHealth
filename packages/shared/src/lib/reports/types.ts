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

export type RecommendationClass = "protect" | "lift" | "expand";

export type RecommendationPrimaryMetric =
  | "clicks"
  | "ctr"
  | "rankings"
  | "crawl_health"
  | "coverage";

export type RecommendationExpectedDirection =
  | "recover"
  | "improve"
  | "preserve"
  | "expand";

export type RecommendationSuccessWindow = "0-7d" | "7-21d" | "14-42d" | "30-90d";

export type RecommendationConfidenceLabel = "high" | "medium" | "exploratory";

export type RecommendationOwner =
  | "seo"
  | "content"
  | "developer"
  | "decision_maker";

export type RecommendationEffort = "XS" | "S" | "M" | "L";

export type RecommendationTimeToValue = "days" | "weeks" | "months";

export type RecommendationState =
  | "open"
  | "in_progress"
  | "done"
  | "ignored"
  | "snoozed";

export type RecommendationFeedbackType =
  | "helpful"
  | "not_helpful"
  | "too_generic"
  | "not_applicable"
  | "already_done";

export type RecommendationEvidenceFact = {
  label: string;
  value: string;
};

export type RecommendationValueAtStake = {
  clicksAtRisk?: number | null;
  recoveryPotential?: number | null;
  nearWinOpportunity?: number | null;
  trafficExposure?: number | null;
  revenueProxy?: number | null;
};

export type RecommendationAffectedTarget = {
  url: string;
  clicks?: number | null;
  impressions?: number | null;
  position?: number | null;
};

export type RecommendationDetail = {
  observed: string[];
  likelyCauses: string[];
  recommendedActions: string[];
  whyThisHelps: string[];
  expectedOutcome: string[];
  evidence: {
    deterministic: RecommendationEvidenceFact[];
    inferred: string[];
  };
};

export type RecommendationSummary = {
  recommendationClass: RecommendationClass;
  primaryMetric: RecommendationPrimaryMetric;
  expectedDirection: RecommendationExpectedDirection;
  successWindow: RecommendationSuccessWindow;
  successSignal: string;
  timeToValue: RecommendationTimeToValue;
  firstVisibleWin: string;
  valueAtStake: RecommendationValueAtStake;
  confidenceLabel: RecommendationConfidenceLabel;
  confidenceScore?: number | null;
  confidenceBasis: string;
  owner: RecommendationOwner;
  effort: RecommendationEffort;
  priorityReason: string;
  targetPage?: string | null;
  supportingQueries?: string[];
  affectedTargets?: RecommendationAffectedTarget[];
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
  actionDetail?: RecommendationDetail | null;
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
  actionDetail?: RecommendationDetail | null;
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
  actionDetail?: RecommendationDetail | null;
};

export type CannibalizationRow = {
  query: string;
  pages: string[];
  totalClicks: number;
  totalImpressions: number;
  recommendation: string;
  actionDetail?: RecommendationDetail | null;
};

export type TechnicalIssueRow = {
  issueType: string;
  affectedPages: number;
  affectedEstimatedClicks: number;
  affectedTargets?: RecommendationAffectedTarget[];
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
  actionDetail?: RecommendationDetail | null;
};

export type ContentDecayRow = {
  page: string;
  peakClicks: number;
  recentClicks: number;
  decayRatio: number;
  peakDate: string;
  estimatedLostClicks: number;
  severity: ReportSectionPriority;
  actionDetail: RecommendationDetail | null;
};

export type LostClickEstimateRow = {
  query: string;
  impressions: number;
  actualCtr: number;
  benchmarkCtr: number;
  positionBucket: number;
  estimatedLostClicks: number;
  confidence: number | null;
  actionDetail: RecommendationDetail | null;
};

export type WeeklyActionRow = RecommendationSummary & {
  id: string;
  rank: number;
  area: "technical" | "content" | "onpage" | "analytics";
  title: string;
  whyNow: string;
  detail: RecommendationDetail;
};

export type NotRecommendedRow = RecommendationSummary & {
  id: string;
  area: "technical" | "content" | "onpage" | "analytics";
  title: string;
  notRecommendedReason: string;
  detail: RecommendationDetail;
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
  weeklyActionRows?: WeeklyActionRow[];
  notRecommendedRows?: NotRecommendedRow[];
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

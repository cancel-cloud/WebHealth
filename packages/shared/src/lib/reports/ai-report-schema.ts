import { z } from "zod";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";

const priority = z.enum(["KRITISCH", "HOCH", "MITTEL", "NIEDRIG"]);
const recommendationClass = z.enum(["protect", "lift", "expand"]);
const recommendationPrimaryMetric = z.enum(["clicks", "ctr", "rankings", "crawl_health", "coverage"]);
const recommendationExpectedDirection = z.enum(["recover", "improve", "preserve", "expand"]);
const recommendationSuccessWindow = z.enum(["0-7d", "7-21d", "14-42d", "30-90d"]);
const recommendationConfidenceLabel = z.enum(["high", "medium", "exploratory"]);
const recommendationOwner = z.enum(["seo", "content", "developer", "decision_maker"]);
const recommendationEffort = z.enum(["XS", "S", "M", "L"]);
const recommendationTimeToValue = z.enum(["days", "weeks", "months"]);

type JsonSchema = Record<string, unknown>;

const metadataSchema = z.object({
  language: z.string().min(2),
  schemaVersion: z.string().min(1),
  reportTitle: z.string().min(1),
  periodLabel: z.string().min(1),
  createdAtIso: z.string().min(10),
  notes: z.array(z.string()).default([]),
});

const kpiComparisonRowSchema = z.object({
  metric: z.string().min(1),
  previous: z.string(),
  current: z.string(),
  delta: z.string(),
  assessment: z.string(),
});

const contentAuditRowSchema = z.object({
  page: z.string().min(1),
  currentState: z.string(),
  problem: z.string(),
  recommendation: z.string(),
  keywordPotential: z.string(),
  effort: z.string(),
  priority,
  estimatedImpact: z.number().nullable().default(null),
  actionDetail: z.string().nullable().default(null),
  refreshStrategy: z.string().nullable().default(null),
});

const keywordLandingpageRowSchema = z.object({
  keyword: z.string().min(1),
  impressions: z.string(),
  currentPosition: z.string(),
  currentLandingpage: z.string(),
  recommendedLandingpage: z.string(),
  missingContent: z.string(),
  priority,
});

const faqPlanRowSchema = z.object({
  category: z.string(),
  question: z.string(),
  targetKeyword: z.string(),
  priority,
});

const technicalQuickWinRowSchema = z.object({
  index: z.number().int().nonnegative(),
  measure: z.string(),
  problem: z.string(),
  solution: z.string(),
  effort: z.string(),
  impact: priority,
});

const actionPlanRowSchema = z.object({
  phase: z.string(),
  week: z.string(),
  measure: z.string(),
  description: z.string(),
  owner: z.string(),
  status: z.string(),
});

const clientChecklistRowSchema = z.object({
  index: z.number().int().nonnegative(),
  requiredItem: z.string(),
  description: z.string(),
  forPhase: z.string(),
  status: z.string(),
});

const siteChangeEntrySchema = z.object({
  url: z.string().min(1),
  changedFields: z.array(z.string()).default([]),
  machineDiffSummary: z.string().default(""),
});

const kpiTrendRowSchema = z.object({
  date: z.string().min(8),
  clicksCurrent: z.number(),
  clicksCompare: z.number(),
  impressionsCurrent: z.number(),
  impressionsCompare: z.number(),
  ctrCurrent: z.number(),
  ctrCompare: z.number(),
  positionCurrent: z.number(),
  positionCompare: z.number(),
  sessionsCurrent: z.number().optional(),
  sessionsCompare: z.number().optional(),
  usersCurrent: z.number().optional(),
  usersCompare: z.number().optional(),
});

const recommendationEvidenceFactSchema = z.object({
  label: z.string(),
  value: z.string(),
});

const recommendationDetailSchema = z.object({
  observed: z.array(z.string()).default([]),
  likelyCauses: z.array(z.string()).default([]),
  recommendedActions: z.array(z.string()).default([]),
  whyThisHelps: z.array(z.string()).default([]),
  expectedOutcome: z.array(z.string()).default([]),
  evidence: z.object({
    deterministic: z.array(recommendationEvidenceFactSchema).default([]),
    inferred: z.array(z.string()).default([]),
  }).default({
    deterministic: [],
    inferred: [],
  }),
});

const recommendationValueAtStakeSchema = z.object({
  clicksAtRisk: z.number().nullable().default(null),
  recoveryPotential: z.number().nullable().default(null),
  nearWinOpportunity: z.number().nullable().default(null),
  trafficExposure: z.number().nullable().default(null),
  revenueProxy: z.number().nullable().default(null),
});

const recommendationAffectedTargetSchema = z.object({
  url: z.string(),
  clicks: z.number().nullable().default(null),
  impressions: z.number().nullable().default(null),
  position: z.number().nullable().default(null),
});

const recommendationSummarySchema = z.object({
  recommendationClass,
  primaryMetric: recommendationPrimaryMetric,
  expectedDirection: recommendationExpectedDirection,
  successWindow: recommendationSuccessWindow,
  successSignal: z.string(),
  timeToValue: recommendationTimeToValue,
  firstVisibleWin: z.string(),
  valueAtStake: recommendationValueAtStakeSchema,
  confidenceLabel: recommendationConfidenceLabel,
  confidenceScore: z.number().nullable().default(null),
  confidenceBasis: z.string(),
  owner: recommendationOwner,
  effort: recommendationEffort,
  priorityReason: z.string(),
  targetPage: z.string().nullable().default(null),
  supportingQueries: z.array(z.string()).default([]),
  affectedTargets: z.array(recommendationAffectedTargetSchema).default([]),
});

const queryOpportunitySchema = z.object({
  query: z.string(),
  clicks: z.number(),
  impressions: z.number(),
  ctr: z.number(),
  position: z.number(),
  expectedCtr: z.number(),
  lostClicksEstimate: z.number(),
  opportunityScore: z.number(),
  recommendedAction: z.string(),
  confidence: z.number().nullable().default(null),
  actionDetail: recommendationDetailSchema.nullable().default(null),
});

const pageWinnerLoserSchema = z.object({
  page: z.string(),
  clicksCurrent: z.number(),
  clicksCompare: z.number(),
  clicksDelta: z.number(),
  impressionsCurrent: z.number(),
  impressionsCompare: z.number(),
  impressionsDelta: z.number(),
  status: z.enum(["winner", "loser", "flat"]),
  isStatisticallySignificant: z.boolean().nullable().default(null),
  zScore: z.number().nullable().default(null),
  actionDetail: recommendationDetailSchema.nullable().default(null),
});

const nearWinKeywordSchema = z.object({
  keyword: z.string(),
  position: z.number(),
  impressions: z.number(),
  clicks: z.number(),
  ctr: z.number(),
  targetLandingPage: z.string().nullable().default(null),
  action: z.string(),
  estimatedImpact: z.number().nullable().default(null),
  actionDetail: recommendationDetailSchema.nullable().default(null),
});

const cannibalizationSchema = z.object({
  query: z.string(),
  pages: z.array(z.string()),
  totalClicks: z.number(),
  totalImpressions: z.number(),
  recommendation: z.string(),
  actionDetail: recommendationDetailSchema.nullable().default(null),
});

const technicalIssueSchema = z.object({
  issueType: z.string(),
  affectedPages: z.number(),
  affectedEstimatedClicks: z.number(),
  affectedTargets: z.array(recommendationAffectedTargetSchema).default([]),
  severity: priority,
  recommendation: z.string(),
});

const actionBacklogSchema = z.object({
  id: z.string(),
  area: z.enum(["technical", "content", "onpage", "analytics"]),
  task: z.string(),
  ownerHint: z.enum(["developer", "seo", "content", "marketing"]),
  effort: z.enum(["S", "M", "L"]),
  impactScore: z.number(),
  why: z.string(),
  done: z.boolean(),
  actionDetail: recommendationDetailSchema.nullable().default(null),
});

const weeklyActionSchema = recommendationSummarySchema.extend({
  id: z.string(),
  rank: z.number().int().positive(),
  area: z.enum(["technical", "content", "onpage", "analytics"]),
  title: z.string(),
  whyNow: z.string(),
  detail: recommendationDetailSchema,
});

const notRecommendedSchema = recommendationSummarySchema.extend({
  id: z.string(),
  area: z.enum(["technical", "content", "onpage", "analytics"]),
  title: z.string(),
  notRecommendedReason: z.string(),
  detail: recommendationDetailSchema,
});

const contentDecayRowSchema = z.object({
  page: z.string(),
  peakClicks: z.number(),
  recentClicks: z.number(),
  decayRatio: z.number(),
  peakDate: z.string(),
  estimatedLostClicks: z.number(),
  severity: priority,
  actionDetail: recommendationDetailSchema.nullable().default(null),
});

const lostClickEstimateRowSchema = z.object({
  query: z.string(),
  impressions: z.number(),
  actualCtr: z.number(),
  benchmarkCtr: z.number(),
  positionBucket: z.number(),
  estimatedLostClicks: z.number(),
  confidence: z.number().nullable().default(null),
  actionDetail: recommendationDetailSchema.nullable().default(null),
});

const alertsAndFlagsSchema = z.object({
  contentDecayDetected: z.boolean(),
  significantLosers: z.array(z.string()).default([]),
  cannibalizationCount: z.number(),
  criticalTechnicalIssues: z.number(),
});

const scoringMethodologySchema = z.object({
  ctrBenchmarkSource: z.enum(["site-specific", "global-fallback"]),
  significanceTestUsed: z.boolean(),
  decayWindowDays: z.number(),
  insightSchemaVersion: z.string(),
});

const workbookGscQueryRowSchema = z.object({
  query: z.string(),
  clicks: z.number(),
  impressions: z.number(),
  ctr: z.number(),
  position: z.number(),
});

const workbookGscPageRowSchema = z.object({
  page: z.string(),
  clicks: z.number(),
  impressions: z.number(),
});

const workbookGaChannelRowSchema = z.object({
  medium: z.string(),
  sessions: z.number(),
  users: z.number(),
});

const workbookGaLandingPageRowSchema = z.object({
  landingPage: z.string(),
  sessions: z.number(),
  pageviews: z.number(),
});

const workbookSchema = z.object({
  gscQueries: z.array(workbookGscQueryRowSchema).default([]),
  gscPages: z.array(workbookGscPageRowSchema).default([]),
  gaChannels: z.array(workbookGaChannelRowSchema).default([]),
  gaLandingPages: z.array(workbookGaLandingPageRowSchema).default([]),
});

export const aiSeoReportSchema = z.object({
  metadata: metadataSchema,
  dashboardMarkdown: z.string().default(""),
  executiveSummary: z.object({
    headline: z.string(),
    topActionAreas: z.array(z.string()).default([]),
  }),
  kpiComparisonRows: z.array(kpiComparisonRowSchema).default([]),
  contentAuditRows: z.array(contentAuditRowSchema).default([]),
  keywordLandingpageRows: z.array(keywordLandingpageRowSchema).default([]),
  faqPlanRows: z.array(faqPlanRowSchema).default([]),
  technicalQuickWinRows: z.array(technicalQuickWinRowSchema).default([]),
  actionPlanRows: z.array(actionPlanRowSchema).default([]),
  clientChecklistRows: z.array(clientChecklistRowSchema).default([]),
  siteChanges: z
    .object({
      newPages: z.array(siteChangeEntrySchema).default([]),
      changedPages: z.array(siteChangeEntrySchema).default([]),
      removedPages: z.array(siteChangeEntrySchema).default([]),
    })
    .default({ newPages: [], changedPages: [], removedPages: [] }),
  kpiTrendRows: z.array(kpiTrendRowSchema).default([]),
  queryOpportunityRows: z.array(queryOpportunitySchema).default([]),
  pageWinnerLoserRows: z.array(pageWinnerLoserSchema).default([]),
  nearWinKeywordRows: z.array(nearWinKeywordSchema).default([]),
  cannibalizationRows: z.array(cannibalizationSchema).default([]),
  technicalIssueRows: z.array(technicalIssueSchema).default([]),
  weeklyActionRows: z.array(weeklyActionSchema).default([]),
  notRecommendedRows: z.array(notRecommendedSchema).default([]),
  actionBacklogRows: z.array(actionBacklogSchema).default([]),
  contentDecayRows: z.array(contentDecayRowSchema).nullable().default(null),
  lostClickEstimateRows: z.array(lostClickEstimateRowSchema).nullable().default(null),
  alertsAndFlags: alertsAndFlagsSchema.nullable().default(null),
  scoringMethodology: scoringMethodologySchema.nullable().default(null),
  workbookDataset: workbookSchema.default({
    gscQueries: [],
    gscPages: [],
    gaChannels: [],
    gaLandingPages: [],
  }),
});

export type AiSeoReportV2 = z.infer<typeof aiSeoReportSchema>;

export const aiSeoReportJsonSchema = z.toJSONSchema(aiSeoReportSchema, {
  target: "draft-7",
}) as JsonSchema;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function makeNullable(schema: JsonSchema): JsonSchema {
  if (Array.isArray(schema.anyOf) && schema.anyOf.some((entry) => (entry as JsonSchema)?.type === "null")) {
    return schema;
  }

  if (Array.isArray(schema.type)) {
    if (!schema.type.includes("null")) {
      return { ...schema, type: [...schema.type, "null"] };
    }
    return schema;
  }

  if (typeof schema.type === "string") {
    return { ...schema, type: [schema.type, "null"] };
  }

  return {
    anyOf: [schema, { type: "null" }],
    default: null,
  };
}

function normalizeForOpenAiStrict(node: unknown): unknown {
  if (!node || typeof node !== "object") return node;

  const schema = node as JsonSchema;

  if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
    const rawProps = schema.properties as Record<string, unknown>;
    const propKeys = Object.keys(rawProps);

    const originalRequired = Array.isArray(schema.required)
      ? (schema.required as string[])
      : [];

    const normalizedProps: Record<string, unknown> = {};
    for (const key of propKeys) {
      const normalizedChild = normalizeForOpenAiStrict(rawProps[key]) as JsonSchema;
      normalizedProps[key] = originalRequired.includes(key)
        ? normalizedChild
        : makeNullable(normalizedChild);
    }

    return {
      ...schema,
      properties: normalizedProps,
      required: propKeys,
      additionalProperties: false,
    };
  }

  if (schema.type === "array" && schema.items) {
    return {
      ...schema,
      items: normalizeForOpenAiStrict(schema.items),
    };
  }

  if (Array.isArray(schema.anyOf)) {
    return {
      ...schema,
      anyOf: schema.anyOf.map((entry) => normalizeForOpenAiStrict(entry)),
    };
  }

  if (Array.isArray(schema.oneOf)) {
    return {
      ...schema,
      oneOf: schema.oneOf.map((entry) => normalizeForOpenAiStrict(entry)),
    };
  }

  return schema;
}

export function buildOpenAiStrictJsonSchema(baseSchema: JsonSchema): JsonSchema {
  return normalizeForOpenAiStrict(deepClone(baseSchema)) as JsonSchema;
}

export const aiSeoReportJsonSchemaForOpenAI = buildOpenAiStrictJsonSchema(aiSeoReportJsonSchema);

export function parseAiSeoReport(value: unknown): AiSeoReport {
  return aiSeoReportSchema.parse(value) as AiSeoReport;
}

export function safeParseAiSeoReport(value: unknown) {
  return aiSeoReportSchema.safeParse(value);
}

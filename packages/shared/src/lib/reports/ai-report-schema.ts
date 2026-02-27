import { z } from "zod";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";

const priority = z.enum(["KRITISCH", "HOCH", "MITTEL", "NIEDRIG"]);

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
});

const nearWinKeywordSchema = z.object({
  keyword: z.string(),
  position: z.number(),
  impressions: z.number(),
  clicks: z.number(),
  ctr: z.number(),
  targetLandingPage: z.string().nullable().default(null),
  action: z.string(),
});

const cannibalizationSchema = z.object({
  query: z.string(),
  pages: z.array(z.string()),
  totalClicks: z.number(),
  totalImpressions: z.number(),
  recommendation: z.string(),
});

const technicalIssueSchema = z.object({
  issueType: z.string(),
  affectedPages: z.number(),
  affectedEstimatedClicks: z.number(),
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
  actionBacklogRows: z.array(actionBacklogSchema).default([]),
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

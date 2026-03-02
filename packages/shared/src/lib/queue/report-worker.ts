import OpenAI from "openai";
import { nanoid } from "nanoid";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import {
  account,
  aiReportSettings,
  ga4DailyFacts,
  gscDailyFacts,
  reports,
  teamMembers,
} from "@webhealth/shared/db/schema";
import { crawlWebsite, type CrawlResult } from "@webhealth/shared/lib/crawl";
import { isEnabled } from "@webhealth/shared/lib/feature-flags";
import {
  fetchGa4Metrics,
  fetchGa4ReportProfile,
  fetchGscMetrics,
  fetchGscQueryPagePairs,
  getGoogleAuthClient,
  type GscMetrics,
} from "@webhealth/shared/lib/google/api";
import { composeReportMetricsFromCache, ensureMetricsCoverageForReport } from "@webhealth/shared/lib/metrics-cache";
import { estimateOpenAICostUsd } from "@webhealth/shared/lib/openai/cost-estimator";
import { getArtifactStore } from "@webhealth/shared/lib/reports/artifacts/store";
import {
  aiSeoReportJsonSchema,
  aiSeoReportJsonSchemaForOpenAI,
  parseAiSeoReport,
  safeParseAiSeoReport,
} from "@webhealth/shared/lib/reports/ai-report-schema";
import { chooseFallbackStrategy } from "@webhealth/shared/lib/reports/ai-output-strategy";
import { buildDeterministicInsights } from "@webhealth/shared/lib/reports/deterministic-insights";
import {
  extractStructuredPayload,
  isSuccessfulResponseStatus,
  isSchemaContractError,
  isTerminalResponseStatus,
  pollOpenAiResponse,
  startOpenAiReportGeneration,
  startOpenAiWithFallback,
} from "@webhealth/shared/lib/reports/openai-orchestrator";
import { buildAiReportPrompt } from "@webhealth/shared/lib/reports/prompt-builder";
import { resolveReportLanguage } from "@webhealth/shared/lib/reports/report-language";
import { computeAndPersistSiteChanges } from "@webhealth/shared/lib/reports/site-change-tracker";
import { buildSanitizedReportInputSnapshot } from "@webhealth/shared/lib/reports/snapshot-sanitizer";
import type { AiSeoReport, OpenAIRequestTrace } from "@webhealth/shared/lib/reports/types";
import { buildWorkbookBufferFromAiReport } from "@webhealth/shared/lib/reports/xlsx-builder";
import { resolveReportSourcesForExistingReport } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { enqueueReportJob } from "@webhealth/shared/lib/queue/report-jobs";
import {
  appendReportJobEvent,
  claimNextReportJob,
  completeReportJob,
  failReportJob,
  heartbeatReportJob,
  updateReportJobPhase,
  type ClaimedReportJob,
} from "@webhealth/shared/lib/queue/report-jobs";

export type WorkerLoopControls = {
  stop: () => void;
};

type TrendPoint = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  sessions?: number;
  users?: number;
};

type ReportDataPayload = {
  gsc: { current: GscMetrics; compare: GscMetrics };
  ga4: {
    current: Record<string, unknown> | null;
    compare: Record<string, unknown> | null;
  };
  crawl: CrawlResult | null;
};

const configuredOpenAiOrg = process.env.OPENAI_ORG?.trim() || null;

function buildOpenAiClient(opts?: { omitOrganization?: boolean }) {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL ?? undefined,
    organization: opts?.omitOrganization ? undefined : configuredOpenAiOrg ?? undefined,
    project: process.env.OPENAI_PROJECT ?? undefined,
  });
}

const openaiClient = buildOpenAiClient();
const openaiClientWithoutOrg = buildOpenAiClient({ omitOrganization: true });

function isOpenAiOrganizationHeaderMismatch(error: unknown) {
  const status =
    typeof (error as { status?: unknown })?.status === "number"
      ? ((error as { status: number }).status)
      : null;
  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown })?.message === "string"
        ? ((error as { message: string }).message)
        : "";

  if (status !== 401) return false;
  return /openai-organization header should match organization/i.test(message);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDate(input: unknown) {
  if (input instanceof Date) return input.toISOString().slice(0, 10);
  return String(input).slice(0, 10);
}

function asNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function appendRequestTrace(
  existing: unknown,
  trace: OpenAIRequestTrace
): Array<Record<string, unknown>> {
  const current = Array.isArray(existing)
    ? (existing as Array<Record<string, unknown>>)
    : [];

  return [...current, trace as unknown as Record<string, unknown>].slice(-20);
}

type PromptPayloadTrimResult = {
  payload: Record<string, unknown>;
  budgetTokens: number;
  beforeTokens: number;
  afterTokens: number;
  trimmed: boolean;
  capActions: Array<{ path: string; before: number; after: number }>;
};

function estimatePromptTokensFromPayload(payload: Record<string, unknown>) {
  return Math.ceil(JSON.stringify(payload).length / 4);
}

function deepCloneRecord(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function applyArrayCapAtPath(
  payload: Record<string, unknown>,
  path: string[],
  limit: number
): { changed: boolean; before: number; after: number } {
  let cursor: unknown = payload;
  for (let i = 0; i < path.length - 1; i += 1) {
    if (!cursor || typeof cursor !== "object") {
      return { changed: false, before: 0, after: 0 };
    }
    cursor = (cursor as Record<string, unknown>)[path[i]];
  }

  if (!cursor || typeof cursor !== "object") {
    return { changed: false, before: 0, after: 0 };
  }

  const key = path[path.length - 1];
  const existing = (cursor as Record<string, unknown>)[key];
  if (!Array.isArray(existing)) {
    return { changed: false, before: 0, after: 0 };
  }

  const before = existing.length;
  if (before <= limit) {
    return { changed: false, before, after: before };
  }

  (cursor as Record<string, unknown>)[key] = existing.slice(0, limit);
  return { changed: true, before, after: limit };
}

function trimPromptPayloadToBudget(input: {
  payload: Record<string, unknown>;
  inputTokenBudget: number;
}): PromptPayloadTrimResult {
  const budget = Math.max(1_000, input.inputTokenBudget);
  const cloned = deepCloneRecord(input.payload);
  const beforeTokens = estimatePromptTokensFromPayload(cloned);
  const capActions: Array<{ path: string; before: number; after: number }> = [];

  if (beforeTokens <= budget) {
    return {
      payload: cloned,
      budgetTokens: budget,
      beforeTokens,
      afterTokens: beforeTokens,
      trimmed: false,
      capActions,
    };
  }

  const capPasses: Array<Array<{ path: string[]; limit: number }>> = [
    [
      { path: ["metrics", "gsc", "current", "topQueries"], limit: 20 },
      { path: ["metrics", "gsc", "compare", "topQueries"], limit: 20 },
      { path: ["metrics", "gsc", "current", "topPages"], limit: 20 },
      { path: ["metrics", "gsc", "compare", "topPages"], limit: 20 },
      { path: ["deterministic", "kpiTrendRows"], limit: 90 },
      { path: ["deterministic", "queryOpportunityRows"], limit: 35 },
      { path: ["deterministic", "pageWinnerLoserRows"], limit: 35 },
      { path: ["deterministic", "nearWinKeywordRows"], limit: 30 },
      { path: ["deterministic", "cannibalizationRows"], limit: 20 },
      { path: ["deterministic", "technicalIssueRows"], limit: 25 },
      { path: ["deterministic", "actionBacklogRows"], limit: 15 },
      { path: ["deterministic", "workbookDataset", "gscQueries"], limit: 250 },
      { path: ["deterministic", "workbookDataset", "gscPages"], limit: 250 },
      { path: ["deterministic", "workbookDataset", "gaChannels"], limit: 250 },
      { path: ["deterministic", "workbookDataset", "gaLandingPages"], limit: 250 },
      { path: ["siteChanges", "newPages"], limit: 75 },
      { path: ["siteChanges", "changedPages"], limit: 75 },
      { path: ["siteChanges", "removedPages"], limit: 75 },
    ],
    [
      { path: ["metrics", "gsc", "current", "topQueries"], limit: 12 },
      { path: ["metrics", "gsc", "compare", "topQueries"], limit: 12 },
      { path: ["metrics", "gsc", "current", "topPages"], limit: 12 },
      { path: ["metrics", "gsc", "compare", "topPages"], limit: 12 },
      { path: ["deterministic", "kpiTrendRows"], limit: 60 },
      { path: ["deterministic", "queryOpportunityRows"], limit: 20 },
      { path: ["deterministic", "pageWinnerLoserRows"], limit: 20 },
      { path: ["deterministic", "nearWinKeywordRows"], limit: 15 },
      { path: ["deterministic", "cannibalizationRows"], limit: 12 },
      { path: ["deterministic", "technicalIssueRows"], limit: 15 },
      { path: ["deterministic", "actionBacklogRows"], limit: 10 },
      { path: ["deterministic", "workbookDataset", "gscQueries"], limit: 120 },
      { path: ["deterministic", "workbookDataset", "gscPages"], limit: 120 },
      { path: ["deterministic", "workbookDataset", "gaChannels"], limit: 120 },
      { path: ["deterministic", "workbookDataset", "gaLandingPages"], limit: 120 },
      { path: ["siteChanges", "newPages"], limit: 40 },
      { path: ["siteChanges", "changedPages"], limit: 40 },
      { path: ["siteChanges", "removedPages"], limit: 40 },
    ],
    [
      { path: ["metrics", "gsc", "current", "topQueries"], limit: 8 },
      { path: ["metrics", "gsc", "compare", "topQueries"], limit: 8 },
      { path: ["metrics", "gsc", "current", "topPages"], limit: 8 },
      { path: ["metrics", "gsc", "compare", "topPages"], limit: 8 },
      { path: ["deterministic", "kpiTrendRows"], limit: 40 },
      { path: ["deterministic", "queryOpportunityRows"], limit: 12 },
      { path: ["deterministic", "pageWinnerLoserRows"], limit: 12 },
      { path: ["deterministic", "nearWinKeywordRows"], limit: 10 },
      { path: ["deterministic", "cannibalizationRows"], limit: 8 },
      { path: ["deterministic", "technicalIssueRows"], limit: 10 },
      { path: ["deterministic", "actionBacklogRows"], limit: 8 },
      { path: ["deterministic", "workbookDataset", "gscQueries"], limit: 60 },
      { path: ["deterministic", "workbookDataset", "gscPages"], limit: 60 },
      { path: ["deterministic", "workbookDataset", "gaChannels"], limit: 60 },
      { path: ["deterministic", "workbookDataset", "gaLandingPages"], limit: 60 },
      { path: ["siteChanges", "newPages"], limit: 20 },
      { path: ["siteChanges", "changedPages"], limit: 20 },
      { path: ["siteChanges", "removedPages"], limit: 20 },
    ],
  ];

  let afterTokens = beforeTokens;
  for (const pass of capPasses) {
    for (const op of pass) {
      const result = applyArrayCapAtPath(cloned, op.path, op.limit);
      if (result.changed) {
        capActions.push({ path: op.path.join("."), before: result.before, after: result.after });
      }
    }

    afterTokens = estimatePromptTokensFromPayload(cloned);
    if (afterTokens <= budget) break;
  }

  return {
    payload: cloned,
    budgetTokens: budget,
    beforeTokens,
    afterTokens,
    trimmed: afterTokens < beforeTokens,
    capActions,
  };
}

function shouldRunXlsxForJob(job: ClaimedReportJob) {
  return (
    !!job.payload &&
    typeof job.payload === "object" &&
    ((job.payload as Record<string, unknown>).runXlsx as boolean | undefined) !== false
  );
}

async function queueXlsxJobFromReportGeneration(job: ClaimedReportJob) {
  await enqueueReportJob({
    reportId: job.reportId,
    teamId: job.teamId,
    kind: "render_xlsx",
    priority: 110,
    payload: { sourceJobId: job.id },
  });

  await appendReportJobEvent({
    jobId: job.id,
    reportId: job.reportId,
    teamId: job.teamId,
    phase: "store_report",
    level: "info",
    message: "Queued render_xlsx job",
  });
}

async function getTeamOwnerGoogleAuth(teamId: string) {
  const owner = await db.query.teamMembers.findFirst({
    where: and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, "owner")),
  });
  if (!owner) throw new Error("No team owner found");

  const googleAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, owner.userId), eq(account.providerId, "google")),
  });
  if (!googleAccount?.accessToken) throw new Error("Google account not linked");

  const authClient = getGoogleAuthClient(
    googleAccount.accessToken,
    googleAccount.refreshToken ?? undefined
  );

  return { owner, googleAccount, authClient };
}

async function loadDailyTrends(params: {
  propertyId: string;
  ga4PropertyId?: string | null;
  start: string;
  end: string;
}) {
  const gscRows = await db.query.gscDailyFacts.findMany({
    where: and(
      eq(gscDailyFacts.propertyId, params.propertyId),
      gte(gscDailyFacts.sourceDate, params.start),
      lte(gscDailyFacts.sourceDate, params.end)
    ),
    orderBy: (t, { asc }) => [asc(t.sourceDate)],
  });

  const ga4Rows = params.ga4PropertyId
    ? await db.query.ga4DailyFacts.findMany({
        where: and(
          eq(ga4DailyFacts.ga4PropertyId, params.ga4PropertyId),
          gte(ga4DailyFacts.sourceDate, params.start),
          lte(ga4DailyFacts.sourceDate, params.end)
        ),
        orderBy: (t, { asc }) => [asc(t.sourceDate)],
      })
    : [];

  const gaByDate = new Map(
    ga4Rows.map((row) => [formatDate(row.sourceDate), row])
  );

  return gscRows.map((row) => {
    const date = formatDate(row.sourceDate);
    const ga = gaByDate.get(date);
    return {
      date,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: asNum(row.ctr),
      position: asNum(row.position),
      sessions: ga?.sessions,
      users: ga?.users,
    } satisfies TrendPoint;
  });
}

function alignCompareSeriesToCurrent(current: TrendPoint[], compare: TrendPoint[]) {
  return current.map((row, index) => {
    const cmp = compare[index];
    return {
      date: row.date,
      clicks: cmp?.clicks ?? 0,
      impressions: cmp?.impressions ?? 0,
      ctr: cmp?.ctr ?? 0,
      position: cmp?.position ?? 0,
      sessions: cmp?.sessions,
      users: cmp?.users,
    } satisfies TrendPoint;
  });
}

function defaultMasterPrompt() {
  return [
    "You are a senior technical SEO and growth analyst.",
    "Use deterministic metrics and page-change signals to produce a paid-grade actionable report.",
    "Prioritize findings by measurable impact and implementation effort.",
    "Never invent metrics. If evidence is weak, state uncertainty explicitly.",
    "Return valid structured JSON matching the schema.",
  ].join("\n");
}

function buildTechnicalQuickWinsFromBacklog(
  backlog: Array<{ task: string; why: string; effort: string; impactScore: number }>
) {
  return backlog.slice(0, 10).map((item, index) => ({
    index: index + 1,
    measure: item.task,
    problem: item.why,
    solution: item.task,
    effort: item.effort,
    impact:
      item.impactScore >= 80
        ? "KRITISCH"
        : item.impactScore >= 60
          ? "HOCH"
          : item.impactScore >= 35
            ? "MITTEL"
            : "NIEDRIG",
  })) as AiSeoReport["technicalQuickWinRows"];
}

function buildFallbackReportFromDeterministic(params: {
  reportTitle: string;
  periodLabel: string;
  language: string;
  schemaVersion: string;
  markdown: string;
  siteChanges: AiSeoReport["siteChanges"];
  deterministic: ReturnType<typeof buildDeterministicInsights>;
}): AiSeoReport {
  return {
    metadata: {
      language: params.language,
      schemaVersion: params.schemaVersion,
      reportTitle: params.reportTitle,
      periodLabel: params.periodLabel,
      createdAtIso: new Date().toISOString(),
      notes: ["Fallback deterministic report used due to structured AI parse failure."],
    },
    dashboardMarkdown: params.markdown,
    executiveSummary: params.deterministic.executiveSummary,
    kpiComparisonRows: params.deterministic.kpiComparisonRows,
    contentAuditRows: [],
    keywordLandingpageRows: [],
    faqPlanRows: [],
    technicalQuickWinRows: buildTechnicalQuickWinsFromBacklog(params.deterministic.actionBacklogRows),
    actionPlanRows: params.deterministic.actionBacklogRows.slice(0, 10).map((row, index) => ({
      phase: index < 5 ? "1. Quick Wins" : "2. Sprint Backlog",
      week: index < 5 ? "1" : "2",
      measure: row.task,
      description: row.why,
      owner: row.ownerHint,
      status: "☐",
    })),
    clientChecklistRows: [],
    siteChanges: params.siteChanges,
    kpiTrendRows: params.deterministic.kpiTrendRows,
    queryOpportunityRows: params.deterministic.queryOpportunityRows,
    pageWinnerLoserRows: params.deterministic.pageWinnerLoserRows,
    nearWinKeywordRows: params.deterministic.nearWinKeywordRows,
    cannibalizationRows: params.deterministic.cannibalizationRows,
    technicalIssueRows: params.deterministic.technicalIssueRows,
    actionBacklogRows: params.deterministic.actionBacklogRows,
    workbookDataset: params.deterministic.workbookDataset,
  };
}

async function buildReportInputs(job: ClaimedReportJob) {
  const report = await db.query.reports.findFirst({
    where: (r, { eq }) => eq(r.id, job.reportId),
  });
  if (!report) throw new Error("Report not found");

  const resolvedSources = await resolveReportSourcesForExistingReport(report);
  const property = resolvedSources.canonicalGscProperty;
  const teamAuth = await getTeamOwnerGoogleAuth(report.teamId);

  await ensureMetricsCoverageForReport({
    teamId: report.teamId,
    triggeredByUserId: teamAuth.owner.userId,
    property,
    dateRangeStart: formatDate(report.dateRangeStart),
    dateRangeEnd: formatDate(report.dateRangeEnd),
    compareRangeStart: formatDate(report.compareRangeStart),
    compareRangeEnd: formatDate(report.compareRangeEnd),
    authClient: teamAuth.authClient,
    refreshRecentDays: 7,
  });

  const cachedMetrics = await composeReportMetricsFromCache({
    property,
    dateRangeStart: formatDate(report.dateRangeStart),
    dateRangeEnd: formatDate(report.dateRangeEnd),
    compareRangeStart: formatDate(report.compareRangeStart),
    compareRangeEnd: formatDate(report.compareRangeEnd),
    refreshRecentDays: 7,
  });

  const [gscCurrent, gscCompare, ga4CurrentBase, ga4CompareBase] = cachedMetrics
    ? [
        cachedMetrics.gsc.current,
        cachedMetrics.gsc.compare,
        cachedMetrics.ga4.current,
        cachedMetrics.ga4.compare,
      ]
    : await (async () => {
        const [liveGscCurrent, liveGscCompare] = await Promise.all([
          fetchGscMetrics(
            teamAuth.authClient,
            property.url,
            formatDate(report.dateRangeStart),
            formatDate(report.dateRangeEnd)
          ),
          fetchGscMetrics(
            teamAuth.authClient,
            property.url,
            formatDate(report.compareRangeStart),
            formatDate(report.compareRangeEnd)
          ),
        ]);

        const [liveGa4Current, liveGa4Compare] = property.ga4PropertyId
          ? await Promise.all([
              fetchGa4Metrics(
                teamAuth.authClient,
                property.ga4PropertyId,
                formatDate(report.dateRangeStart),
                formatDate(report.dateRangeEnd)
              ),
              fetchGa4Metrics(
                teamAuth.authClient,
                property.ga4PropertyId,
                formatDate(report.compareRangeStart),
                formatDate(report.compareRangeEnd)
              ),
            ])
          : [null, null];

        return [liveGscCurrent, liveGscCompare, liveGa4Current, liveGa4Compare] as const;
      })();

  let ga4Current = ga4CurrentBase as Record<string, unknown> | null;
  let ga4Compare = ga4CompareBase as Record<string, unknown> | null;

  if (property.ga4PropertyId) {
    try {
      const profile = await fetchGa4ReportProfile(
        teamAuth.authClient,
        property.ga4PropertyId,
        formatDate(report.dateRangeStart),
        formatDate(report.dateRangeEnd),
        formatDate(report.compareRangeStart),
        formatDate(report.compareRangeEnd)
      );

      ga4Current = { ...(ga4CurrentBase ?? {}), ...profile.current };
      ga4Compare = { ...(ga4CompareBase ?? {}), ...profile.compare };
    } catch (error) {
      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: "preprocess",
        level: "warn",
        message: "GA4 profile fetch failed; using summary-only GA4 payload",
        meta: {
          ga4PropertyId: property.ga4PropertyId,
          error: error instanceof Error ? error.message : "Unknown GA4 profile error",
        },
      });
    }
  }

  const crawlingEnabled = await isEnabled("crawling_enabled", teamAuth.owner.userId);
  const crawlData = crawlingEnabled ? await crawlWebsite(property.url, 120) : null;

  const queryPagePairsCurrent = await fetchGscQueryPagePairs(
    teamAuth.authClient,
    property.url,
    formatDate(report.dateRangeStart),
    formatDate(report.dateRangeEnd)
  ).catch(() => []);

  const currentSeries = await loadDailyTrends({
    propertyId: property.id,
    ga4PropertyId: property.ga4PropertyId,
    start: formatDate(report.dateRangeStart),
    end: formatDate(report.dateRangeEnd),
  });
  const compareSeriesRaw = await loadDailyTrends({
    propertyId: property.id,
    ga4PropertyId: property.ga4PropertyId,
    start: formatDate(report.compareRangeStart),
    end: formatDate(report.compareRangeEnd),
  });
  const compareSeries = alignCompareSeriesToCurrent(currentSeries, compareSeriesRaw);

  const siteChanges = crawlData
    ? await computeAndPersistSiteChanges({
        reportId: report.id,
        teamId: report.teamId,
        propertyId: property.id,
        pages: crawlData.pages,
      })
    : { newPages: [], changedPages: [], removedPages: [] };

  const deterministic = buildDeterministicInsights({
    gscCurrent: gscCurrent as unknown as Parameters<typeof buildDeterministicInsights>[0]["gscCurrent"],
    gscCompare: gscCompare as unknown as Parameters<typeof buildDeterministicInsights>[0]["gscCompare"],
    ga4Current: ga4Current as unknown as Parameters<typeof buildDeterministicInsights>[0]["ga4Current"],
    ga4Compare: ga4Compare as unknown as Parameters<typeof buildDeterministicInsights>[0]["ga4Compare"],
    crawl: crawlData,
    siteChanges,
    currentSeries,
    compareSeries,
    queryPagePairsCurrent,
  });

  const reportData: ReportDataPayload = {
    gsc: {
      current: gscCurrent as GscMetrics,
      compare: gscCompare as GscMetrics,
    },
    ga4: {
      current: ga4Current,
      compare: ga4Compare,
    },
    crawl: crawlData,
  };

  return {
    report,
    property,
    teamAuth,
    reportData,
    deterministic,
    siteChanges,
  };
}

async function pollUntilFinished(params: {
  client: OpenAI;
  responseId: string;
  reportId: string;
  jobId: string;
  maxWaitMs?: number;
}) {
  const timeoutMs = params.maxWaitMs ?? parseInt(process.env.REPORT_OPENAI_POLL_TIMEOUT_MS ?? "360000", 10);
  const intervalMs = parseInt(process.env.REPORT_OPENAI_POLL_INTERVAL_MS ?? "3000", 10);

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const polled = await pollOpenAiResponse({
      client: params.client,
      responseId: params.responseId,
      reportId: params.reportId,
      jobId: params.jobId,
    });

    if (isTerminalResponseStatus(polled.status)) {
      return polled;
    }

    await sleep(intervalMs);
  }

  throw new Error("OpenAI background response polling timed out");
}

async function processGenerateReportJob(job: ClaimedReportJob) {
  const reportBefore = await db.query.reports.findFirst({
    where: (r, { eq }) => eq(r.id, job.reportId),
  });
  if (!reportBefore) throw new Error("Report not found");

  if (reportBefore.aiReportJson) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "preprocess",
      level: "info",
      message: "AI report already exists; skipping generation",
    });
    return;
  }

  await updateReportJobPhase(job.id, "preprocess");
  await db
    .update(reports)
    .set({ status: "processing", aiStatus: "preprocessing", error: null, updatedAt: new Date() })
    .where(eq(reports.id, job.reportId));

  const { report, property, teamAuth, reportData, deterministic, siteChanges } = await buildReportInputs(job);

  await updateReportJobPhase(job.id, "site_changes");
  await appendReportJobEvent({
    jobId: job.id,
    reportId: report.id,
    teamId: report.teamId,
    phase: "site_changes",
    level: "info",
    message: "Deterministic site change tracking completed",
    meta: {
      newPages: siteChanges.newPages.length,
      changedPages: siteChanges.changedPages.length,
      removedPages: siteChanges.removedPages.length,
    },
  });

  await updateReportJobPhase(job.id, "deterministic_scoring");
  await db
    .update(reports)
    .set({
      data: reportData as unknown as Record<string, unknown>,
      siteChanges: siteChanges as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, job.reportId));

  const settings = await ensureDefaultAiReportSettings();
  const promptVersion = settings.promptVersionId
    ? await db.query.aiReportPromptVersions.findFirst({
        where: (p, { eq }) => eq(p.id, settings.promptVersionId!),
      })
    : null;

  const languageResolution = await resolveReportLanguage({
    userId: teamAuth.owner.userId,
    googleIdToken: teamAuth.googleAccount.idToken,
  });
  const language = languageResolution.language;

  const promptInputPayload = {
    report: {
      id: report.id,
      propertyId: report.propertyId,
      period: `${formatDate(report.dateRangeStart)} - ${formatDate(report.dateRangeEnd)}`,
      comparePeriod: `${formatDate(report.compareRangeStart)} - ${formatDate(report.compareRangeEnd)}`,
      language,
    },
    metrics: reportData,
    siteChanges,
    deterministic,
  };

  const promptPayloadTrim = trimPromptPayloadToBudget({
    payload: promptInputPayload as unknown as Record<string, unknown>,
    inputTokenBudget: settings.inputTokenBudget,
  });
  const payloadForPrompt = promptPayloadTrim.payload;

  if (promptPayloadTrim.trimmed) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: report.id,
      teamId: report.teamId,
      phase: "deterministic_scoring",
      level: "warn",
      message: "input_budget_trim_applied",
      meta: {
        budgetTokens: promptPayloadTrim.budgetTokens,
        beforeTokens: promptPayloadTrim.beforeTokens,
        afterTokens: promptPayloadTrim.afterTokens,
        capsApplied: promptPayloadTrim.capActions.slice(0, 25),
      },
    });
  }

  const prompt = buildAiReportPrompt({
    masterPrompt: promptVersion?.template ?? defaultMasterPrompt(),
    schemaVersion: settings.schemaVersion,
    language,
    outputStrategy: settings.outputStrategy as "json_schema" | "tool_strict",
    examples: promptVersion?.examples ?? null,
    reportMetadata: {
      reportId: report.id,
      teamId: report.teamId,
      property: property.url,
      createdAt: new Date().toISOString(),
    },
    payload: payloadForPrompt,
    promptVersionId: promptVersion?.id ?? null,
    model: settings.model,
  });

  const sanitizedSnapshot = buildSanitizedReportInputSnapshot(payloadForPrompt);

  await db
    .update(reports)
    .set({
      aiInputSnapshotSanitized: sanitizedSnapshot,
      aiPromptVersionId: promptVersion?.id ?? null,
      aiPromptSnapshot: prompt.prompt,
      aiOutputStrategy: settings.outputStrategy,
      aiModel: settings.model,
      aiStatus: "generating",
      updatedAt: new Date(),
    })
    .where(eq(reports.id, report.id));

  const payload = (job.payload ?? {}) as Record<string, unknown>;
  const modelOverride = typeof payload.modelOverride === "string" ? payload.modelOverride : null;
  const selectedModel = modelOverride ?? settings.model;
  const schemaForModel = settings.useStrictSchema
    ? aiSeoReportJsonSchemaForOpenAI
    : aiSeoReportJsonSchema;
  const costCapUsd = Number(process.env.REPORT_AI_COST_CAP_USD ?? "1");
  const maxOutputTokens =
    typeof settings.maxOutputTokens === "number" && settings.maxOutputTokens > 0
      ? settings.maxOutputTokens
      : undefined;
  let activeOpenAiClient: OpenAI = openaiClient;
  let usedOrgHeaderFallback = false;

  const runWithOrgHeaderFallback = async <T>(params: {
    phase: "openai_start" | "openai_poll" | "parse";
    operation: (client: OpenAI) => Promise<T>;
  }) => {
    try {
      return await params.operation(activeOpenAiClient);
    } catch (error) {
      if (
        !configuredOpenAiOrg ||
        usedOrgHeaderFallback ||
        !isOpenAiOrganizationHeaderMismatch(error)
      ) {
        throw error;
      }

      usedOrgHeaderFallback = true;
      activeOpenAiClient = openaiClientWithoutOrg;

      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: params.phase,
        level: "warn",
        message: "OpenAI org header mismatch; retrying without organization header",
        meta: {
          configuredOrg: configuredOpenAiOrg,
          retryMode: "without_org_header",
        },
      });

      return params.operation(activeOpenAiClient);
    }
  };

  await updateReportJobPhase(job.id, "openai_start");
  let startResult;
  let requestTraces = Array.isArray(report.openaiRequestIds)
    ? (report.openaiRequestIds as Array<Record<string, unknown>>)
    : [];

  if (reportBefore.openaiResponseId) {
    startResult = {
      responseId: reportBefore.openaiResponseId,
      status: "in_progress",
      strategyUsed: settings.outputStrategy as "json_schema" | "tool_strict",
      responseText: null,
      usage: null,
      xRequestId: null,
      xClientRequestId: `report_${report.id}_job_${job.id}_openai_resume`,
      guardrail: {
        model: selectedModel,
        maxOutputTokens: maxOutputTokens ?? null,
        estimatedMaxCostUsd: null,
        guardrailActions: ["resumed_existing_response"],
      },
      rawResponse: null,
    };
    await appendReportJobEvent({
      jobId: job.id,
      reportId: report.id,
      teamId: report.teamId,
      phase: "openai_start",
      level: "info",
      message: "Resuming existing OpenAI background response",
      meta: { responseId: reportBefore.openaiResponseId },
    });
  } else {
    try {
      startResult = await runWithOrgHeaderFallback({
        phase: "openai_start",
        operation: (client) =>
          startOpenAiWithFallback({
            client,
            reportId: report.id,
            jobId: job.id,
            prompt: prompt.prompt,
            schema: schemaForModel,
            strictSchema: settings.useStrictSchema,
            model: selectedModel,
            fallbackModel: "gpt-5-mini",
            strategy: settings.outputStrategy as "json_schema" | "tool_strict",
            temperature: Number(settings.temperature),
            maxOutputTokens,
            background: settings.useBackgroundMode,
            promptCacheKey: settings.usePromptCaching ? prompt.promptCacheKey : undefined,
            serviceTier: settings.serviceTier,
            costCapUsd,
          }),
      });
    } catch (error) {
      if (!isSchemaContractError(error)) throw error;

      const errorMessage = error instanceof Error ? error.message : "OpenAI schema contract error";
      const markdown = `# SEO Report\n\n${deterministic.executiveSummary.headline}`;
      const deterministicFallback = buildFallbackReportFromDeterministic({
        reportTitle: `SEO Report ${property.name}`,
        periodLabel: `${formatDate(report.dateRangeStart)} - ${formatDate(report.dateRangeEnd)}`,
        language,
        schemaVersion: settings.schemaVersion,
        markdown,
        siteChanges,
        deterministic,
      });

      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: "openai_start",
        level: "error",
        message: "schema_contract_error",
        meta: {
          error: errorMessage,
          outputStrategy: settings.outputStrategy,
          useStrictSchema: settings.useStrictSchema,
        },
      });

      await updateReportJobPhase(job.id, "store_report");
      await db
        .update(reports)
        .set({
          status: "complete",
          aiStatus: "partial",
          data: reportData as unknown as Record<string, unknown>,
          aiReportMarkdown: deterministicFallback.dashboardMarkdown,
          aiReportJson: deterministicFallback as unknown as Record<string, unknown>,
          aiUsage: null,
          aiEstimatedCostUsd: null,
          siteChanges: siteChanges as unknown as Record<string, unknown>,
          xlsxStatus: report.xlsxStatus ?? "pending",
          openaiResponseId: null,
          updatedAt: new Date(),
          error: errorMessage,
        })
        .where(eq(reports.id, report.id));

      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: "store_report",
        level: "warn",
        message: "Stored deterministic fallback report after schema contract error",
      });

      if (shouldRunXlsxForJob(job)) {
        await queueXlsxJobFromReportGeneration(job);
      }
      return;
    }

    requestTraces = appendRequestTrace(report.openaiRequestIds, {
      phase: "openai_start",
      xRequestId: startResult.xRequestId,
      xClientRequestId: startResult.xClientRequestId,
    });

    await appendReportJobEvent({
      jobId: job.id,
      reportId: report.id,
      teamId: report.teamId,
      phase: "openai_start",
      level: "info",
      message: "OpenAI generation started",
      meta: {
        responseId: startResult.responseId,
        model: startResult.guardrail.model,
        guardrailActions: startResult.guardrail.guardrailActions,
        estimatedMaxCostUsd: startResult.guardrail.estimatedMaxCostUsd,
        strategy: startResult.strategyUsed,
        useStrictSchema: settings.useStrictSchema,
        language,
        languageSource: languageResolution.source,
        retriedWithoutOrgHeader: usedOrgHeaderFallback,
      },
    });
  }

  await db
    .update(reports)
    .set({
      openaiResponseId: startResult.responseId,
      openaiRequestIds: requestTraces,
      aiStatus: "generating",
      aiModel: startResult.guardrail.model,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, report.id));

  await updateReportJobPhase(job.id, "openai_poll");

  let finalStatus = startResult.status;
  let finalUsage = startResult.usage;
  let finalResponseText = startResult.responseText;
  let finalPayload =
    startResult.responseText || startResult.rawResponse
      ? extractStructuredPayload({
          responseText: startResult.responseText,
          outputPayload: null,
          rawResponse: startResult.rawResponse,
        })
      : null;

  if (
    startResult.responseId &&
    (settings.useBackgroundMode || !isTerminalResponseStatus(startResult.status))
  ) {
    const responseId = startResult.responseId;
    const polled = await runWithOrgHeaderFallback({
      phase: "openai_poll",
      operation: (client) =>
        pollUntilFinished({
          client,
          responseId,
          reportId: report.id,
          jobId: job.id,
        }),
    });

    const pollTrace = appendRequestTrace(requestTraces, {
      phase: "openai_poll",
      xRequestId: polled.xRequestId,
      xClientRequestId: `report_${report.id}_job_${job.id}_openai_poll`,
    });

    await db
      .update(reports)
      .set({
        openaiRequestIds: pollTrace,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, report.id));

    finalStatus = polled.status;
    finalUsage = polled.usage;
    finalResponseText = polled.responseText;
    finalPayload = extractStructuredPayload({
      responseText: polled.responseText,
      outputPayload: polled.outputPayload,
      rawResponse: polled.rawResponse,
    });
  }

  if (!isSuccessfulResponseStatus(finalStatus)) {
    throw new Error(`OpenAI response did not complete successfully (status: ${finalStatus ?? "unknown"})`);
  }

  await updateReportJobPhase(job.id, "parse");

  let parsed = safeParseAiSeoReport(finalPayload);
  let schemaContractFallbackError: string | null = null;
  let usedDeterministicFallback = false;

  if (!parsed.success) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: report.id,
      teamId: report.teamId,
      phase: "parse",
      level: "warn",
      message: "Primary structured parse failed; retrying with fallback strategy",
      meta: { error: parsed.error.message },
    });

    try {
      const fallbackStart = await runWithOrgHeaderFallback({
        phase: "parse",
        operation: (client) =>
          startOpenAiReportGeneration({
            client,
            reportId: report.id,
            jobId: job.id,
            prompt: prompt.prompt,
            schema: schemaForModel,
            strictSchema: settings.useStrictSchema,
            model: "gpt-5-mini",
            fallbackModel: "gpt-5-mini",
            strategy: chooseFallbackStrategy(settings.outputStrategy as "json_schema" | "tool_strict"),
            temperature: Number(settings.temperature),
            maxOutputTokens:
              maxOutputTokens != null ? Math.max(1200, Math.floor(maxOutputTokens * 0.8)) : undefined,
            background: false,
            promptCacheKey: settings.usePromptCaching ? `${prompt.promptCacheKey}:fallback` : undefined,
            serviceTier: settings.serviceTier,
            costCapUsd,
            phase: "openai_parse_fallback",
          }),
      });

      finalUsage = fallbackStart.usage;
      finalResponseText = fallbackStart.responseText;
      finalPayload = extractStructuredPayload({
        responseText: fallbackStart.responseText,
        outputPayload: null,
        rawResponse: fallbackStart.rawResponse,
      });

      parsed = safeParseAiSeoReport(finalPayload);
    } catch (error) {
      if (!isSchemaContractError(error)) throw error;
      schemaContractFallbackError =
        error instanceof Error ? error.message : "OpenAI schema contract error during parse fallback";
      await appendReportJobEvent({
        jobId: job.id,
        reportId: report.id,
        teamId: report.teamId,
        phase: "parse",
        level: "error",
        message: "schema_contract_error",
        meta: {
          error: schemaContractFallbackError,
          outputStrategy: settings.outputStrategy,
          useStrictSchema: settings.useStrictSchema,
        },
      });
    }
  }

  const markdown =
    typeof finalResponseText === "string" && finalResponseText.trim()
      ? finalResponseText
      : `# SEO Report\n\n${deterministic.executiveSummary.headline}`;

  const aiReport: AiSeoReport = parsed.success
    ? {
        ...parseAiSeoReport(parsed.data),
        metadata: {
          ...parsed.data.metadata,
          language,
          schemaVersion: settings.schemaVersion,
          reportTitle: parsed.data.metadata.reportTitle || `SEO Report ${property.name}`,
          periodLabel:
            parsed.data.metadata.periodLabel ||
            `${formatDate(report.dateRangeStart)} - ${formatDate(report.dateRangeEnd)}`,
          createdAtIso: new Date().toISOString(),
        },
        dashboardMarkdown: parsed.data.dashboardMarkdown || markdown,
        executiveSummary: parsed.data.executiveSummary?.headline
          ? parsed.data.executiveSummary
          : deterministic.executiveSummary,
        kpiComparisonRows:
          parsed.data.kpiComparisonRows?.length > 0
            ? parsed.data.kpiComparisonRows
            : deterministic.kpiComparisonRows,
        technicalQuickWinRows:
          parsed.data.technicalQuickWinRows?.length > 0
            ? parsed.data.technicalQuickWinRows
            : buildTechnicalQuickWinsFromBacklog(deterministic.actionBacklogRows),
        actionPlanRows:
          parsed.data.actionPlanRows?.length > 0
            ? parsed.data.actionPlanRows
            : deterministic.actionBacklogRows.slice(0, 10).map((row, index) => ({
                phase: index < 5 ? "1. Quick Wins" : "2. Sprint Backlog",
                week: index < 5 ? "1" : "2",
                measure: row.task,
                description: row.why,
                owner: row.ownerHint,
                status: "☐",
              })),
        siteChanges,
        kpiTrendRows: deterministic.kpiTrendRows,
        queryOpportunityRows: deterministic.queryOpportunityRows,
        pageWinnerLoserRows: deterministic.pageWinnerLoserRows,
        nearWinKeywordRows: deterministic.nearWinKeywordRows,
        cannibalizationRows: deterministic.cannibalizationRows,
        technicalIssueRows: deterministic.technicalIssueRows,
        actionBacklogRows: deterministic.actionBacklogRows,
        workbookDataset: deterministic.workbookDataset,
      }
    : buildFallbackReportFromDeterministic({
        reportTitle: `SEO Report ${property.name}`,
        periodLabel: `${formatDate(report.dateRangeStart)} - ${formatDate(report.dateRangeEnd)}`,
        language,
        schemaVersion: settings.schemaVersion,
        markdown,
        siteChanges,
        deterministic,
      });

  if (!parsed.success) {
    usedDeterministicFallback = true;
  }

  if (schemaContractFallbackError) {
    usedDeterministicFallback = true;
  }

  const estimatedCost = estimateOpenAICostUsd(startResult.guardrail.model, finalUsage);

  await updateReportJobPhase(job.id, "store_report");
  await db
    .update(reports)
    .set({
      status: "complete",
      aiStatus: usedDeterministicFallback ? "partial" : "complete",
      data: reportData as unknown as Record<string, unknown>,
      aiReportMarkdown: aiReport.dashboardMarkdown,
      aiReportJson: aiReport as unknown as Record<string, unknown>,
      aiUsage: finalUsage?.raw ?? null,
      aiEstimatedCostUsd: estimatedCost != null ? String(estimatedCost) : null,
      siteChanges: siteChanges as unknown as Record<string, unknown>,
      xlsxStatus: report.xlsxStatus ?? "pending",
      openaiResponseId: startResult.responseId,
      updatedAt: new Date(),
      error: schemaContractFallbackError,
    })
    .where(eq(reports.id, report.id));

  await appendReportJobEvent({
    jobId: job.id,
    reportId: report.id,
    teamId: report.teamId,
    phase: "store_report",
    level: "info",
    message: "AI report generated and persisted",
    meta: {
      aiModel: startResult.guardrail.model,
      strategy: settings.outputStrategy,
      aiStatus: usedDeterministicFallback ? "partial" : "complete",
      estimatedCost,
      requestIds: appendRequestTrace(report.openaiRequestIds, {
        phase: "openai_complete",
        xRequestId: null,
        xClientRequestId: `report_${report.id}_job_${job.id}_openai_complete`,
      }),
    },
  });

  if (shouldRunXlsxForJob(job)) {
    await queueXlsxJobFromReportGeneration(job);
  }
}

async function processXlsxRenderJob(job: ClaimedReportJob) {
  await updateReportJobPhase(job.id, "xlsx");
  const report = await db.query.reports.findFirst({
    where: (r, { eq }) => eq(r.id, job.reportId),
  });
  if (!report) throw new Error("Report not found");

  if (!report.aiReportJson) {
    throw new Error("Cannot render XLSX: aiReportJson is missing");
  }

  const aiReport = parseAiSeoReport(report.aiReportJson);

  await db
    .update(reports)
    .set({ xlsxStatus: "generating", updatedAt: new Date() })
    .where(eq(reports.id, job.reportId));

  const buffer = await buildWorkbookBufferFromAiReport(aiReport);
  const store = getArtifactStore();
  const artifact = await store.put({
    reportId: job.reportId,
    kind: "xlsx",
    fileName: "seo-report.xlsx",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  });

  await db
    .update(reports)
    .set({
      xlsxStatus: "ready",
      xlsxArtifactKey: artifact.key,
      xlsxArtifactUrl: artifact.url,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, job.reportId));
}

async function processClaimedJob(job: ClaimedReportJob, workerId: string) {
  let heartbeatTimer: NodeJS.Timeout | null = null;
  try {
    heartbeatTimer = setInterval(() => {
      void heartbeatReportJob(job.id, workerId);
    }, 10_000);

    if (job.kind === "generate_report") {
      await processGenerateReportJob(job);
    } else if (job.kind === "render_xlsx") {
      await processXlsxRenderJob(job);
    } else {
      throw new Error(`Unsupported job kind: ${job.kind}`);
    }

    await completeReportJob(job.id, "done");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    if (job.kind === "render_xlsx") {
      await db
        .update(reports)
        .set({ xlsxStatus: "failed", aiStatus: "partial", error: message, updatedAt: new Date() })
        .where(eq(reports.id, job.reportId));
    } else {
      await db
        .update(reports)
        .set({ status: "failed", aiStatus: "failed", error: message, updatedAt: new Date() })
        .where(eq(reports.id, job.reportId));
    }
    await failReportJob(job.id, message, job.phase);
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}

export async function runSingleReportWorkerTick(workerId = `worker_${nanoid(8)}`) {
  const job = await claimNextReportJob(workerId);
  if (!job) return { processed: false as const };
  await processClaimedJob(job, workerId);
  return { processed: true as const, jobId: job.id };
}

export function startReportWorkerLoop() {
  let stopped = false;
  const workerId = `worker_${nanoid(8)}`;
  const intervalMs = parseInt(process.env.REPORT_WORKER_POLL_MS ?? "3000", 10);

  const loop = async () => {
    if (stopped) return;
    try {
      await runSingleReportWorkerTick(workerId);
    } catch (error) {
      console.error("[report-worker] loop error", error);
    } finally {
      if (!stopped) setTimeout(loop, intervalMs);
    }
  };

  void loop();
  return {
    stop() {
      stopped = true;
    },
  } satisfies WorkerLoopControls;
}

export async function ensureDefaultAiReportSettings() {
  const existing = await db.query.aiReportSettings.findFirst({
    orderBy: (t, { desc }) => [desc(t.updatedAt)],
  });
  if (existing) return existing;

  const [created] = await db
    .insert(aiReportSettings)
    .values({
      id: "default",
      model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
      outputStrategy: "json_schema",
      language: "de",
      useStrictSchema: true,
      schemaVersion: "v1",
    })
    .returning();

  return created;
}

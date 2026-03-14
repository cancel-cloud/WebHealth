import OpenAI from "openai";
import { nanoid } from "nanoid";
import postgres from "postgres";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { requireDirectDatabaseUrl } from "@webhealth/shared/db/url-guards";
import {
  aiReportSettings,
  ga4DailyFacts,
  gscDailyFacts,
  reportDetailAiExpansions,
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
import { extractOpenAIRequestId } from "@webhealth/shared/lib/openai/request-tracing";
import { getArtifactStore } from "@webhealth/shared/lib/reports/artifacts/store";
import {
  buildActionDetailPrompt,
  detailSchema,
  findRow,
  isRowType,
  makeDetailClientRequestId,
  normalizeDetailUsage,
  patchRowActionDetail,
  serializeActionDetail,
  shouldGenerateDetail,
  type RowType,
} from "@webhealth/shared/lib/report-detail";
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
import { getGoogleAccountTokensForUser } from "@webhealth/shared/lib/provider-tokens";
import {
  appendReportJobEvent,
  claimNextReportJob,
  completeReportJob,
  failReportJob,
  heartbeatReportJob,
  requeueJobForRetry,
  updateReportJobPhase,
  type ClaimedReportJob,
  type ReportJobPhase,
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
const DETAIL_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const MAX_DETAIL_WRITE_RETRIES = 5;

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

function supportsTemperature(model: string) {
  return !model.toLowerCase().startsWith("gpt-5");
}

class DetailSaveConflictError extends Error {}

function extractChatCompletionRequestId(response: unknown): string | null {
  const raw = response as {
    _request_id?: string;
    response?: { headers?: Headers | Record<string, string | string[] | undefined> };
  };
  if (raw._request_id) return raw._request_id;
  if (!raw.response?.headers) return null;
  return extractOpenAIRequestId(raw.response.headers);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type WorkerLogLevel = "INFO" | "WARN" | "ERROR" | "FATAL";
type WorkerLogStatus = "BOOT" | "IDLE" | "WORKING" | "XLSX" | "ERROR" | "FATAL";

function formatWorkerLogValue(value: unknown) {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    return /[\s=]/.test(value) ? JSON.stringify(value) : value;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (value instanceof Error) {
    return value.stack ?? value.message;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatWorkerLogContext(context?: Record<string, unknown>) {
  if (!context) return "";
  const keys = Object.keys(context).sort();
  const entries: string[] = [];
  for (const key of keys) {
    const value = context[key];
    if (value === undefined) continue;
    entries.push(`${key}=${formatWorkerLogValue(value)}`);
  }
  return entries.join(" ");
}

function logWorker(
  level: WorkerLogLevel,
  status: WorkerLogStatus,
  message: string,
  context?: Record<string, unknown>,
  error?: unknown
) {
  const contextText = formatWorkerLogContext(context);
  const line = `[report-worker][${level}][${status}] ${message}${contextText ? ` ${contextText}` : ""}`;

  if (level === "INFO") {
    console.log(line);
    return;
  }
  if (level === "WARN") {
    console.warn(line);
    return;
  }
  if (error) {
    console.error(line, error);
    return;
  }
  console.error(line);
}

function logInfo(status: WorkerLogStatus, message: string, context?: Record<string, unknown>) {
  logWorker("INFO", status, message, context);
}

function logWarn(status: WorkerLogStatus, message: string, context?: Record<string, unknown>) {
  logWorker("WARN", status, message, context);
}

function logError(
  status: WorkerLogStatus,
  message: string,
  context?: Record<string, unknown>,
  error?: unknown
) {
  logWorker("ERROR", status, message, context, error);
}

function logFatal(
  status: WorkerLogStatus,
  message: string,
  context?: Record<string, unknown>,
  error?: unknown
) {
  logWorker("FATAL", status, message, context, error);
}

function getIdlePulseMs() {
  const parsed = parseInt(process.env.REPORT_WORKER_IDLE_LOG_EVERY_MS ?? "30000", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30_000;
}

function buildJobLogContext(job: ClaimedReportJob, workerId: string) {
  return {
    workerId,
    jobId: job.id,
    reportId: job.reportId,
    kind: job.kind,
    attempt: job.attempts,
    maxAttempts: job.maxAttempts,
  };
}

async function setJobPhaseWithLog(
  job: ClaimedReportJob,
  workerId: string,
  phase: ReportJobPhase,
  meta?: Record<string, unknown>
) {
  logInfo("WORKING", "phase transition", {
    ...buildJobLogContext(job, workerId),
    phase,
  });
  await updateReportJobPhase(job.id, phase, meta);
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
      { path: ["deterministic", "contentDecayRows"], limit: 15 },
      { path: ["deterministic", "lostClickEstimateRows"], limit: 20 },
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
      { path: ["deterministic", "contentDecayRows"], limit: 10 },
      { path: ["deterministic", "lostClickEstimateRows"], limit: 12 },
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
      { path: ["deterministic", "contentDecayRows"], limit: 8 },
      { path: ["deterministic", "lostClickEstimateRows"], limit: 8 },
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

  const googleAccount = await getGoogleAccountTokensForUser(owner.userId);
  if (!googleAccount?.accessToken) throw new Error("Google account not linked");

  const authClient = getGoogleAuthClient(
    googleAccount.accessToken,
    googleAccount.refreshToken ?? undefined
  );

  return { owner, googleAccount, authClient };
}

async function appendDetailExpansionAttempt(input: {
  reportId: string;
  teamId: string;
  requestedByUserId: string;
  requestNumber: number;
  kind: string;
  rowId: string;
  model: string;
  usage: unknown;
  estimatedCostUsd: number | null;
  xRequestId: string | null;
  xClientRequestId: string;
  status: "success" | "failed";
  error: string | null;
}) {
  await db.insert(reportDetailAiExpansions).values({
    id: `rdae_${nanoid(12)}`,
    reportId: input.reportId,
    teamId: input.teamId,
    requestedByUserId: input.requestedByUserId,
    requestNumber: input.requestNumber,
    kind: input.kind,
    rowId: input.rowId,
    model: input.model,
    usage: input.usage as Record<string, unknown> | null,
    estimatedCostUsd: input.estimatedCostUsd != null ? String(input.estimatedCostUsd) : null,
    xRequestId: input.xRequestId,
    xClientRequestId: input.xClientRequestId,
    status: input.status,
    error: input.error,
  });
}

async function processGenerateDetailJob(job: ClaimedReportJob, workerId: string) {
  const payload =
    job.payload && typeof job.payload === "object"
      ? (job.payload as Record<string, unknown>)
      : {};
  const rowTypeValue = typeof payload.rowType === "string" ? payload.rowType : null;
  const rowId = typeof payload.rowId === "string" ? payload.rowId : null;
  const requestedByUserId =
    typeof payload.requestedByUserId === "string" ? payload.requestedByUserId : null;

  if (!rowTypeValue || !rowId || !requestedByUserId || !isRowType(rowTypeValue)) {
    throw new Error("Invalid generate_detail payload");
  }
  const rowType = rowTypeValue as RowType;

  await setJobPhaseWithLog(job, workerId, "detail", { rowType, rowId });

  const report = await db.query.reports.findFirst({
    where: and(eq(reports.id, job.reportId), eq(reports.teamId, job.teamId)),
  });
  if (!report) throw new Error("Report not found");

  const property = await db.query.properties.findFirst({
    where: (table, { eq }) => eq(table.id, report.propertyId),
  });

  const aiReport = report.aiReportJson as AiSeoReport | null;
  if (!aiReport) throw new Error("No AI report data");

  const rowData = findRow(aiReport, rowType, rowId);
  if (!rowData) throw new Error("Row not found");

  if (!shouldGenerateDetail(rowData)) {
    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "detail",
      level: "info",
      message: "Skipped detail generation because cached detail already exists",
      meta: { rowType, rowId },
    });
    return;
  }

  const [counter] = await db
    .update(reports)
    .set({
      detailsRequestCount: sql`coalesce(${reports.detailsRequestCount}, 0) + 1`,
    })
    .where(eq(reports.id, job.reportId))
    .returning({ requestNumber: reports.detailsRequestCount });
  if (!counter) throw new Error("Report not found");

  const requestNumber = counter.requestNumber;
  const xClientRequestId = makeDetailClientRequestId({
    reportId: job.reportId,
    requestNumber,
    kind: rowType,
  });

  let usageSnapshot: ReturnType<typeof normalizeDetailUsage> = null;
  let callCost: number | null = null;
  let xRequestId: string | null = null;

  try {
    const response = await openaiClient.chat.completions.create(
      {
        model: DETAIL_MODEL,
        messages: [
          {
            role: "user",
            content: buildActionDetailPrompt({
              siteUrl: property?.url ?? report.propertyId,
              dateRangeStart: String(report.dateRangeStart),
              dateRangeEnd: String(report.dateRangeEnd),
              rowType,
              rowData,
            }),
          },
        ],
        temperature: supportsTemperature(DETAIL_MODEL) ? 0.2 : undefined,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "action_detail",
            schema: detailSchema,
            strict: true,
          },
        },
      },
      {
        headers: { "X-Client-Request-Id": xClientRequestId },
      }
    );

    xRequestId = extractChatCompletionRequestId(response);
    usageSnapshot = normalizeDetailUsage(response.usage ?? null);
    callCost = estimateOpenAICostUsd(DETAIL_MODEL, usageSnapshot);

    if (callCost != null) {
      await db
        .update(reports)
        .set({
          detailsCostUsd: sql`(coalesce(${reports.detailsCostUsd}, 0::numeric) + ${callCost})::numeric(12, 6)`,
        })
        .where(eq(reports.id, job.reportId));
    }

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    let finalSerializedDetail = serializeActionDetail(content);
    let saved = false;

    for (let attempt = 0; attempt < MAX_DETAIL_WRITE_RETRIES; attempt += 1) {
      const latestReport =
        attempt === 0
          ? report
          : await db.query.reports.findFirst({
              where: and(eq(reports.id, job.reportId), eq(reports.teamId, job.teamId)),
            });
      if (!latestReport) {
        throw new Error("Report not found");
      }

      const latestAiReport = latestReport.aiReportJson as AiSeoReport | null;
      if (!latestAiReport) {
        throw new Error("No AI report data");
      }

      const latestRowData = findRow(latestAiReport, rowType, rowId);
      if (!latestRowData) {
        throw new Error("Row not found");
      }

      if (!shouldGenerateDetail(latestRowData)) {
        finalSerializedDetail = String(latestRowData.actionDetail ?? finalSerializedDetail);
        saved = true;
        break;
      }

      const patched = patchRowActionDetail(latestAiReport, rowType, rowId, finalSerializedDetail);
      const updated = await db
        .update(reports)
        .set({
          aiReportJson: patched,
          updatedAt: new Date(),
        })
        .where(and(eq(reports.id, job.reportId), eq(reports.updatedAt, latestReport.updatedAt)))
        .returning({ id: reports.id });

      if (updated.length > 0) {
        saved = true;
        break;
      }
    }

    if (!saved) {
      throw new DetailSaveConflictError("Could not save detail due to concurrent updates. Please retry.");
    }

    await appendDetailExpansionAttempt({
      reportId: job.reportId,
      teamId: job.teamId,
      requestedByUserId,
      requestNumber,
      kind: rowType,
      rowId,
      model: DETAIL_MODEL,
      usage: usageSnapshot?.raw ?? usageSnapshot,
      estimatedCostUsd: callCost,
      xRequestId,
      xClientRequestId,
      status: "success",
      error: null,
    });

    await appendReportJobEvent({
      jobId: job.id,
      reportId: job.reportId,
      teamId: job.teamId,
      phase: "detail",
      level: "info",
      message: "Generated action detail",
      meta: { rowType, rowId, requestNumber },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    try {
      await appendDetailExpansionAttempt({
        reportId: job.reportId,
        teamId: job.teamId,
        requestedByUserId,
        requestNumber,
        kind: rowType,
        rowId,
        model: DETAIL_MODEL,
        usage: usageSnapshot?.raw ?? usageSnapshot,
        estimatedCostUsd: callCost,
        xRequestId,
        xClientRequestId,
        status: "failed",
        error: message,
      });
    } catch (insertError) {
      logWarn("ERROR", "failed to persist detail expansion audit row", {
        ...buildJobLogContext(job, workerId),
        rowType,
        rowId,
        insertError: insertError instanceof Error ? insertError.message : "unknown",
      });
    }
    throw error;
  }
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
    compareRangeEnd: formatDate(report.compareRangeEnd),
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

async function processGenerateReportJob(job: ClaimedReportJob, workerId: string) {
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
    logInfo("WORKING", "skipping generation because AI report already exists", {
      ...buildJobLogContext(job, workerId),
    });
    return;
  }

  await setJobPhaseWithLog(job, workerId, "preprocess");
  await db
    .update(reports)
    .set({ status: "processing", aiStatus: "preprocessing", error: null, updatedAt: new Date() })
    .where(eq(reports.id, job.reportId));

  const { report, property, teamAuth, reportData, deterministic, siteChanges } = await buildReportInputs(job);

  await setJobPhaseWithLog(job, workerId, "site_changes");
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

  await setJobPhaseWithLog(job, workerId, "deterministic_scoring");
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
    precomputedContext: {
      ctrBenchmarkSource: deterministic.ctrBenchmarkSummary.ctrBenchmarkSource,
      contentDecayCount: deterministic.contentDecayRows.length,
      significantLosersCount: deterministic.alertsAndFlags.significantLosers.length,
    },
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

  await setJobPhaseWithLog(job, workerId, "openai_start");
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

      await setJobPhaseWithLog(job, workerId, "store_report");
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

  await setJobPhaseWithLog(job, workerId, "openai_poll");

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

  await setJobPhaseWithLog(job, workerId, "parse");

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

  await setJobPhaseWithLog(job, workerId, "store_report");
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

async function processXlsxRenderJob(job: ClaimedReportJob, workerId: string) {
  await setJobPhaseWithLog(job, workerId, "xlsx");
  logInfo("XLSX", "starting xlsx generation", buildJobLogContext(job, workerId));
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

  logInfo("XLSX", "xlsx artifact stored", {
    ...buildJobLogContext(job, workerId),
    artifactKey: artifact.key,
  });
}

async function processClaimedJob(job: ClaimedReportJob, workerId: string) {
  let heartbeatTimer: NodeJS.Timeout | null = null;
  const startedAtMs = Date.now();
  try {
    logInfo("WORKING", "starting claimed job", buildJobLogContext(job, workerId));
    heartbeatTimer = setInterval(() => {
      void heartbeatReportJob(job.id, workerId);
    }, 10_000);

    if (job.kind === "generate_report") {
      await processGenerateReportJob(job, workerId);
    } else if (job.kind === "generate_detail") {
      await processGenerateDetailJob(job, workerId);
    } else if (job.kind === "render_xlsx") {
      await processXlsxRenderJob(job, workerId);
    } else {
      throw new Error(`Unsupported job kind: ${job.kind}`);
    }

    await completeReportJob(job.id, "done");
    logInfo("WORKING", "job completed", {
      ...buildJobLogContext(job, workerId),
      durationMs: Date.now() - startedAtMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    const canRetry = job.attempts < job.maxAttempts;
    if (canRetry) {
      const backoffSeconds = 30 * job.attempts;
      logError(
        "ERROR",
        "job failed and will be retried",
        {
          ...buildJobLogContext(job, workerId),
          backoffSeconds,
          error: message,
        },
        error
      );
      await requeueJobForRetry(job.id, message, backoffSeconds);
      logWarn("WORKING", "job requeued for retry", {
        ...buildJobLogContext(job, workerId),
        backoffSeconds,
        nextAttempt: job.attempts + 1,
      });
    } else {
      logFatal(
        "FATAL",
        "job failed permanently after max attempts",
        {
          ...buildJobLogContext(job, workerId),
          error: message,
        },
        error
      );
      if (job.kind === "render_xlsx") {
        await db
          .update(reports)
          .set({ xlsxStatus: "failed", aiStatus: "partial", error: message, updatedAt: new Date() })
          .where(eq(reports.id, job.reportId));
      } else if (job.kind === "generate_detail") {
        await appendReportJobEvent({
          jobId: job.id,
          reportId: job.reportId,
          teamId: job.teamId,
          phase: "detail",
          level: "error",
          message: "Detail generation failed",
          meta: { error: message },
        });
      } else {
        await db
          .update(reports)
          .set({ status: "failed", aiStatus: "failed", error: message, updatedAt: new Date() })
          .where(eq(reports.id, job.reportId));
      }
      await failReportJob(job.id, message, job.phase);
    }
  } finally {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  }
}

export async function runSingleReportWorkerTick(workerId = `worker_${nanoid(8)}`) {
  const job = await claimNextReportJob(workerId);
  if (!job) return { processed: false as const };
  logInfo("WORKING", "claimed job", buildJobLogContext(job, workerId));
  await processClaimedJob(job, workerId);
  return { processed: true as const, jobId: job.id };
}

export function startReportWorkerLoop() {
  let stopped = false;
  const workerId = `worker_${nanoid(8)}`;
  const intervalMs = parseInt(process.env.REPORT_WORKER_POLL_MS ?? "3000", 10);
  const maxPollMs = parseInt(process.env.REPORT_WORKER_MAX_POLL_MS ?? "30000", 10);
  const idlePulseMs = getIdlePulseMs();
  let isIdle = false;
  let idleSinceMs = 0;
  let lastIdlePulseMs = 0;
  let idleCount = 0;
  let isRunning = false;
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  let listenConn: ReturnType<typeof postgres> | null = null;

  logInfo("BOOT", "worker loop starting", { workerId, pollMs: intervalMs, idlePulseMs });

  const triggerImmediatePoll = () => {
    if (stopped) return;
    if (pendingTimeout !== null) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }
    idleCount = 0;
    void loop();
  };

  try {
    const directUrl = requireDirectDatabaseUrl();
    listenConn = postgres(directUrl, { max: 1 });
    listenConn.listen("job_available", triggerImmediatePoll).catch((err) => {
      logFatal("BOOT", "LISTEN setup failed", { workerId }, err);
      listenConn = null;
    });
    logInfo("BOOT", "LISTEN/NOTIFY enabled", { workerId });
  } catch (err) {
    const reason = err instanceof Error && err.message.includes("DIRECT_DATABASE_URL is required")
      ? "DIRECT_DATABASE_URL not set"
      : `DIRECT_DATABASE_URL misconfigured: ${err instanceof Error ? err.message : String(err)}`;
    logInfo("BOOT", `LISTEN/NOTIFY disabled (${reason})`, { workerId });
  }

  const loop = async () => {
    if (stopped) return;
    if (isRunning) return;
    isRunning = true;
    let processed = false;
    try {
      const result = await runSingleReportWorkerTick(workerId);
      processed = result.processed;
      const now = Date.now();
      if (!result.processed) {
        if (!isIdle) {
          isIdle = true;
          idleSinceMs = now;
          lastIdlePulseMs = now;
          logInfo("IDLE", "queue is idle", { workerId });
        } else if (now - lastIdlePulseMs >= idlePulseMs) {
          lastIdlePulseMs = now;
          logInfo("IDLE", "queue still idle", { workerId, idleForMs: now - idleSinceMs });
        }
      } else if (isIdle) {
        logInfo("WORKING", "leaving idle state after claiming work", {
          workerId,
          jobId: result.jobId,
          idleForMs: now - idleSinceMs,
        });
        isIdle = false;
        idleSinceMs = 0;
        lastIdlePulseMs = 0;
      }
    } catch (error) {
      logFatal("FATAL", "worker loop error", { workerId }, error);
    } finally {
      isRunning = false;
      if (!stopped) {
        const delay = Math.min(intervalMs * Math.pow(2, idleCount), maxPollMs);
        if (!processed) {
          idleCount++;
        } else {
          idleCount = 0;
        }
        pendingTimeout = setTimeout(loop, delay);
      }
    }
  };

  void loop();
  return {
    stop() {
      stopped = true;
      if (pendingTimeout !== null) {
        clearTimeout(pendingTimeout);
        pendingTimeout = null;
      }
      if (listenConn) {
        listenConn.end({ timeout: 5 }).catch(() => {});
        listenConn = null;
      }
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

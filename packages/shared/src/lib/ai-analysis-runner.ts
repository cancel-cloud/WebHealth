import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import {
  actionItems,
  aiAnalysisRuns,
  aiPromptTemplates,
  aiRecommendations,
  ga4ReportArtifacts,
  properties,
} from "@webhealth/shared/db/schema";
import {
  buildAiActionIdentity,
  buildDefaultAiPromptTemplateRows,
  validateAiRecommendation,
  type AiPromptTemplatePurpose,
  type AiRecommendation,
  type EvidenceAnchor,
} from "@webhealth/shared/lib/ai-analysis";
import type { AiUsageSnapshot, WeeklyActionRow } from "@webhealth/shared/lib/action-types";
import { composeReportMetricsFromCache } from "@webhealth/shared/lib/metrics-cache";
import { getLatestPropertyCrawl } from "@webhealth/shared/lib/property-refresh";
import { resolveAnalysisWindow } from "@webhealth/shared/lib/live-dashboard";
import {
  estimateOpenAICostUsd,
  normalizeOpenAIUsage,
} from "@webhealth/shared/lib/openai/cost-estimator";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import { getAiRuntimeSettings } from "@webhealth/shared/lib/ai-runtime-settings";

type DateString = string;

type AiSourceSummary = {
  summary: string;
  keyFindings: EvidenceAnchor[];
  caveats: string[];
};

type AiAnalyzerOutput = {
  recommendations: AiRecommendation[];
};

type AiPromptVersionMap = Record<AiPromptTemplatePurpose, number>;

type OpenAIJsonResult<T> = {
  output: T;
  usage: ReturnType<typeof normalizeOpenAIUsage>;
  raw: unknown;
};

const SOURCE_SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "keyFindings", "caveats"],
  properties: {
    summary: { type: "string" },
    keyFindings: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["source", "label", "value", "url", "query"],
        properties: {
          source: { type: "string", enum: ["gsc", "ga4", "crawl", "rules", "comparison", "model"] },
          label: { type: "string" },
          value: { type: "string" },
          url: { type: ["string", "null"] },
          query: { type: ["string", "null"] },
        },
      },
    },
    caveats: { type: "array", items: { type: "string" } },
  },
} as const;

const ANALYZER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["recommendations"],
  properties: {
    recommendations: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "title",
          "area",
          "target",
          "summary",
          "clientSafeSummary",
          "confidence",
          "evidenceAnchors",
        ],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          area: { type: "string", enum: ["technical", "content", "onpage", "analytics"] },
          target: {
            type: "object",
            additionalProperties: false,
            required: ["type", "value"],
            properties: {
              type: { type: "string", enum: ["url", "query", "issue_scope"] },
              value: { type: "string" },
            },
          },
          summary: { type: "string" },
          clientSafeSummary: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "exploratory"] },
          evidenceAnchors: SOURCE_SUMMARY_SCHEMA.properties.keyFindings,
        },
      },
    },
  },
} as const;

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function safeLatestDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 2);
  return formatDate(date);
}

function hashJson(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function truncateRows<T>(rows: T[] | undefined, limit = 10): T[] {
  return Array.isArray(rows) ? rows.slice(0, limit) : [];
}

function buildSourceInput(params: {
  metrics: NonNullable<Awaited<ReturnType<typeof composeReportMetricsFromCache>>>;
  crawl: Awaited<ReturnType<typeof getLatestPropertyCrawl>>;
  ga4Profile: unknown | null;
}) {
  return {
    gsc: {
      current: {
        clicks: params.metrics.gsc.current.clicks,
        impressions: params.metrics.gsc.current.impressions,
        ctr: params.metrics.gsc.current.ctr,
        position: params.metrics.gsc.current.position,
        topQueries: truncateRows(params.metrics.gsc.current.topQueries),
        topPages: truncateRows(params.metrics.gsc.current.topPages),
        queryPagePairs: truncateRows(params.metrics.gsc.current.queryPagePairs),
        topCountries: truncateRows(params.metrics.gsc.current.topCountries),
        topDevices: truncateRows(params.metrics.gsc.current.topDevices),
      },
      compare: {
        clicks: params.metrics.gsc.compare.clicks,
        impressions: params.metrics.gsc.compare.impressions,
        ctr: params.metrics.gsc.compare.ctr,
        position: params.metrics.gsc.compare.position,
        topQueries: truncateRows(params.metrics.gsc.compare.topQueries),
        topPages: truncateRows(params.metrics.gsc.compare.topPages),
        queryPagePairs: truncateRows(params.metrics.gsc.compare.queryPagePairs),
        topCountries: truncateRows(params.metrics.gsc.compare.topCountries),
        topDevices: truncateRows(params.metrics.gsc.compare.topDevices),
      },
    },
    ga4: params.metrics.ga4.current
      ? {
          current: params.metrics.ga4.current,
          compare: params.metrics.ga4.compare,
          reportProfile: params.ga4Profile,
        }
      : null,
    crawl: params.crawl?.crawl
      ? {
          capturedAt: params.crawl.createdAt,
          summary: params.crawl.crawl.summary,
          issuePages: params.crawl.crawl.pages
            .filter((page) => page.issues.length > 0)
            .slice(0, 15)
            .map((page) => ({
              url: page.url,
              canonicalUrl: page.canonicalUrl,
              issues: page.issues.slice(0, 8),
              title: page.title,
              metaDescription: page.metaDescription,
              h1Count: page.h1Count,
              h1Texts: page.h1Texts,
              noindex: page.noindex,
              nofollow: page.nofollow,
              imageMissingAltCount: page.imageMissingAltCount,
              hasStructuredData: page.hasStructuredData,
              hasViewportMeta: page.hasViewportMeta,
              visibleTextExcerpt: page.visibleTextExcerpt?.slice(0, 1200),
            })),
        }
      : null,
  };
}

async function ensurePromptTemplates() {
  await db
    .insert(aiPromptTemplates)
    .values(buildDefaultAiPromptTemplateRows())
    .onConflictDoNothing();

  const rows = await db.query.aiPromptTemplates.findMany({
    where: eq(aiPromptTemplates.isActive, true),
    orderBy: [aiPromptTemplates.purpose, desc(aiPromptTemplates.version)],
  });

  const byPurpose = new Map<AiPromptTemplatePurpose, typeof rows[number]>();
  for (const row of rows) {
    const purpose = row.purpose as AiPromptTemplatePurpose;
    if (!byPurpose.has(purpose)) byPurpose.set(purpose, row);
  }

  return byPurpose;
}

function extractResponseText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const record = response as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = Array.isArray(record.output) ? record.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? ((item as Record<string, unknown>).content as unknown[])
      : [];
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const partRecord = part as Record<string, unknown>;
      if (typeof partRecord.text === "string") chunks.push(partRecord.text);
    }
  }
  return chunks.join("\n").trim();
}

function describeOpenAIResponseWithoutText(raw: unknown) {
  if (!raw || typeof raw !== "object") return "OpenAI response did not include JSON text output.";
  const record = raw as Record<string, unknown>;
  const details = {
    status: typeof record.status === "string" ? record.status : undefined,
    incomplete_details: record.incomplete_details,
    error: record.error,
    usage: record.usage,
  };
  return `OpenAI response did not include JSON text output. Details: ${JSON.stringify(details)}`;
}

async function callOpenAIJson<T>(params: {
  model: string;
  systemPrompt: string;
  userInput: unknown;
  schemaName: string;
  schema: unknown;
  maxOutputTokens: number;
}): Promise<OpenAIJsonResult<T>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const headers: Record<string, string> = {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
  if (process.env.OPENAI_ORG) headers["OpenAI-Organization"] = process.env.OPENAI_ORG;
  if (process.env.OPENAI_PROJECT) headers["OpenAI-Project"] = process.env.OPENAI_PROJECT;

  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: params.model,
      input: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: JSON.stringify(params.userInput) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: params.schemaName,
          strict: true,
          schema: params.schema,
        },
      },
      max_output_tokens: params.maxOutputTokens,
    }),
  });

  const raw = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      raw && typeof raw === "object" && "error" in raw
        ? JSON.stringify((raw as Record<string, unknown>).error)
        : `OpenAI Responses API failed with ${response.status}`;
    throw new Error(message);
  }

  const text = extractResponseText(raw);
  if (!text) throw new Error(describeOpenAIResponseWithoutText(raw));

  return {
    output: JSON.parse(text) as T,
    usage: normalizeOpenAIUsage((raw as Record<string, unknown> | null)?.usage),
    raw,
  };
}

function combineUsage(items: Array<ReturnType<typeof normalizeOpenAIUsage>>): AiUsageSnapshot | null {
  const present = items.filter(Boolean);
  if (!present.length) return null;
  return present.reduce<AiUsageSnapshot>(
    (total, item) => ({
      inputTokens: (total.inputTokens ?? 0) + (item?.inputTokens ?? 0),
      outputTokens: (total.outputTokens ?? 0) + (item?.outputTokens ?? 0),
      totalTokens: (total.totalTokens ?? 0) + (item?.totalTokens ?? 0),
      cachedInputTokens: (total.cachedInputTokens ?? 0) + (item?.cachedInputTokens ?? 0),
      reasoningTokens: (total.reasoningTokens ?? 0) + (item?.reasoningTokens ?? 0),
    }),
    {},
  );
}

function aiRecommendationToWeeklyAction(params: {
  recommendation: AiRecommendation;
  aiRunId: string;
  rank: number;
}): WeeklyActionRow {
  const targetValue = params.recommendation.target?.value ?? params.recommendation.title;
  return {
    id: `weekly_ai_${params.recommendation.id}`,
    rank: params.rank,
    area: params.recommendation.area,
    title: params.recommendation.title,
    whyNow: params.recommendation.summary,
    source: "ai",
    aiRunId: params.aiRunId,
    evidenceAnchors: params.recommendation.evidenceAnchors,
    clientSafeSummary: params.recommendation.clientSafeSummary,
    recommendationClass: "lift",
    primaryMetric: params.recommendation.area === "technical" ? "crawl_health" : "clicks",
    expectedDirection: "improve",
    successWindow: "14-42d",
    successSignal: "Evidence-backed movement in the cited URL, query, or issue scope.",
    timeToValue: "weeks",
    firstVisibleWin: params.recommendation.clientSafeSummary,
    valueAtStake: {},
    confidenceLabel: params.recommendation.confidence,
    confidenceScore:
      params.recommendation.confidence === "high"
        ? 0.9
        : params.recommendation.confidence === "medium"
          ? 0.7
          : 0.45,
    confidenceBasis: "AI recommendation with at least two evidence anchors.",
    owner: params.recommendation.area === "technical" ? "developer" : "seo",
    effort: params.recommendation.area === "technical" ? "M" : "S",
    priorityReason: params.recommendation.summary,
    targetPage: params.recommendation.target?.type === "url" ? targetValue : null,
    supportingQueries: params.recommendation.target?.type === "query" ? [targetValue] : [],
    detail: {
      observed: params.recommendation.evidenceAnchors.map((anchor) => `${anchor.label}: ${anchor.value}`),
      likelyCauses: [params.recommendation.summary],
      recommendedActions: [params.recommendation.clientSafeSummary],
      whyThisHelps: ["The recommendation is tied to current Search Console, Analytics, crawl, or comparison evidence."],
      expectedOutcome: ["Improve the cited SEO signal and verify against the next refreshed window."],
      evidence: {
        deterministic: params.recommendation.evidenceAnchors.map((anchor) => ({
          label: anchor.label,
          value: anchor.value,
        })),
        inferred: [],
      },
    },
  };
}

async function failRun(runId: string, message: string, phase = "failed") {
  await db
    .update(aiAnalysisRuns)
    .set({
      status: "failed",
      phase,
      error: message,
      finishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(aiAnalysisRuns.id, runId));
}

export async function runAiAnalysisForPropertyWindow(params: {
  teamId: string;
  propertyId: string;
  refreshJobId?: string | null;
  triggeredByUserId?: string | null;
  preset?: string | null;
  compareMode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const property = await db.query.properties.findFirst({
    where: and(eq(properties.id, params.propertyId), eq(properties.teamId, params.teamId)),
  });
  if (!property) throw new Error(`Property not found: ${params.propertyId}`);

  const window = resolveAnalysisWindow({
    preset: params.preset,
    compareMode: params.compareMode,
    startDate: params.startDate,
    endDate: params.endDate,
    safeLatestDate: safeLatestDate(),
  });
  if (!window.compareStartDate || !window.compareEndDate) {
    return { status: "skipped" as const, reason: "AI analysis requires a comparison window." };
  }

  const prompts = await ensurePromptTemplates();
  const runtimeSettings = await getAiRuntimeSettings();
  const promptVersions = Object.fromEntries(
    [...prompts.entries()].map(([purpose, template]) => [purpose, template.version]),
  ) as AiPromptVersionMap;

  const [metrics, crawl] = await Promise.all([
    composeReportMetricsFromCache({
      property,
      dateRangeStart: window.startDate,
      dateRangeEnd: window.endDate,
      compareRangeStart: window.compareStartDate,
      compareRangeEnd: window.compareEndDate,
    }),
    getLatestPropertyCrawl({ teamId: params.teamId, propertyId: property.id }),
  ]);
  const ga4Profile = property.ga4PropertyId
    ? await db.query.ga4ReportArtifacts.findFirst({
        where: and(
          eq(ga4ReportArtifacts.ga4PropertyId, property.ga4PropertyId),
          eq(ga4ReportArtifacts.dateStart, window.startDate),
          eq(ga4ReportArtifacts.dateEnd, window.endDate),
        ),
        orderBy: [desc(ga4ReportArtifacts.fetchedAt)],
      })
    : null;

  const sourceInput = metrics ? buildSourceInput({ metrics, crawl, ga4Profile: ga4Profile?.reportPayload ?? null }) : null;
  const sourceVersionHash = hashJson({
    window,
    sourceInput,
    crawlFingerprint: crawl?.fingerprint ?? null,
    promptVersions,
    runtimeSettings: {
      summaryModel: runtimeSettings.summaryModel,
      analyzerModel: runtimeSettings.analyzerModel,
      maxOutputTokens: runtimeSettings.maxOutputTokens,
    },
  });
  const runId = `air_${nanoid(12)}`;
  const [run] = await db
    .insert(aiAnalysisRuns)
    .values({
      id: runId,
      teamId: params.teamId,
      propertyId: property.id,
      refreshJobId: params.refreshJobId ?? null,
      preset: window.preset,
      startDate: window.startDate,
      endDate: window.endDate,
      compareMode: window.compareMode,
      compareStartDate: window.compareStartDate,
      compareEndDate: window.compareEndDate,
      sourceVersionHash,
      status: "processing",
      phase: "source_check",
      summaryModel: runtimeSettings.summaryModel,
      analyzerModel: runtimeSettings.analyzerModel,
      promptVersions,
      sourceSummaryInput: sourceInput,
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        aiAnalysisRuns.propertyId,
        aiAnalysisRuns.startDate,
        aiAnalysisRuns.endDate,
        aiAnalysisRuns.compareMode,
        aiAnalysisRuns.compareStartDate,
        aiAnalysisRuns.compareEndDate,
        aiAnalysisRuns.sourceVersionHash,
      ],
      set: {
        refreshJobId: params.refreshJobId ?? null,
        status: "processing",
        phase: "source_check",
        error: null,
        summaryModel: runtimeSettings.summaryModel,
        analyzerModel: runtimeSettings.analyzerModel,
        sourceSummaryInput: sourceInput,
        promptVersions,
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  void recordProductEvent({
    teamId: params.teamId,
    userId: params.triggeredByUserId ?? null,
    name: "ai_run_started",
    source: "worker",
    entityType: "property",
    entityId: property.id,
    properties: { aiRunId: run.id, refreshJobId: params.refreshJobId ?? null },
  }).catch(() => {});

  if (!sourceInput) {
    await failRun(run.id, "Missing complete GSC/GA4 source coverage for the selected and comparison windows.", "source_check");
    return { status: "failed" as const, runId: run.id, reason: "missing_source_coverage" };
  }

  try {
    await db.update(aiAnalysisRuns).set({ phase: "source_summaries", updatedAt: new Date() }).where(eq(aiAnalysisRuns.id, run.id));

    const summaryModel = run.summaryModel ?? runtimeSettings.summaryModel;
    const analyzerModel = run.analyzerModel ?? runtimeSettings.analyzerModel;
    const [gscSummary, ga4Summary, crawlSummary] = await Promise.all([
      callOpenAIJson<AiSourceSummary>({
        model: summaryModel,
        systemPrompt: prompts.get("gsc_source_summary")!.systemPrompt,
        userInput: sourceInput.gsc,
        schemaName: "gsc_source_summary",
        schema: SOURCE_SUMMARY_SCHEMA,
        maxOutputTokens: runtimeSettings.maxOutputTokens,
      }),
      callOpenAIJson<AiSourceSummary>({
        model: summaryModel,
        systemPrompt: prompts.get("ga4_source_summary")!.systemPrompt,
        userInput: sourceInput.ga4 ?? { note: "No linked GA4 property." },
        schemaName: "ga4_source_summary",
        schema: SOURCE_SUMMARY_SCHEMA,
        maxOutputTokens: runtimeSettings.maxOutputTokens,
      }),
      callOpenAIJson<AiSourceSummary>({
        model: summaryModel,
        systemPrompt: prompts.get("crawl_source_summary")!.systemPrompt,
        userInput: sourceInput.crawl ?? { note: "No crawl snapshot available." },
        schemaName: "crawl_source_summary",
        schema: SOURCE_SUMMARY_SCHEMA,
        maxOutputTokens: runtimeSettings.maxOutputTokens,
      }),
    ]);

    await db.update(aiAnalysisRuns).set({ phase: "analysis", updatedAt: new Date() }).where(eq(aiAnalysisRuns.id, run.id));

    const analyzer = await callOpenAIJson<AiAnalyzerOutput>({
      model: analyzerModel,
      systemPrompt: prompts.get("main_analyzer")!.systemPrompt,
      userInput: {
        window,
        summaries: {
          gsc: gscSummary.output,
          ga4: ga4Summary.output,
          crawl: crawlSummary.output,
        },
      },
      schemaName: "ai_recommendations",
      schema: ANALYZER_SCHEMA,
      maxOutputTokens: runtimeSettings.maxOutputTokens,
    });

    const validRecommendations = analyzer.output.recommendations.filter((recommendation) => {
      return validateAiRecommendation(recommendation).ok;
    });
    const usage = combineUsage([gscSummary.usage, ga4Summary.usage, crawlSummary.usage, analyzer.usage]);
    const summaryCost = estimateOpenAICostUsd(summaryModel, combineUsage([gscSummary.usage, ga4Summary.usage, crawlSummary.usage])) ?? 0;
    const analyzerCost = estimateOpenAICostUsd(analyzerModel, analyzer.usage) ?? 0;
    const totalCost = Number((summaryCost + analyzerCost).toFixed(6));

    await db
      .update(aiAnalysisRuns)
      .set({
        status: "complete",
        phase: "done",
        sourceSummaries: {
          gsc: gscSummary.output,
          ga4: ga4Summary.output,
          crawl: crawlSummary.output,
        },
        analyzerOutput: analyzer.output,
        usageSnapshot: usage,
        costEstimateUsd: String(totalCost),
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aiAnalysisRuns.id, run.id));

    for (const [index, recommendation] of validRecommendations.entries()) {
      const identity = buildAiActionIdentity({
        target: recommendation.target!,
        title: recommendation.title,
      });
      const weeklyAction = aiRecommendationToWeeklyAction({
        recommendation,
        aiRunId: run.id,
        rank: index + 1,
      });
      const existingAction = await db.query.actionItems.findFirst({
        where: and(eq(actionItems.propertyId, property.id), eq(actionItems.fingerprint, identity.fingerprint)),
      });
      const [action] = await db
        .insert(actionItems)
        .values({
          id: existingAction?.id ?? `ai_${nanoid(12)}`,
          teamId: params.teamId,
          propertyId: property.id,
          fingerprint: identity.fingerprint,
          actionFamily: identity.actionFamily,
          causeFamily: identity.causeFamily,
          remedyKey: identity.remedyKey,
          targetType: identity.targetType,
          targetKey: identity.targetKey,
          title: recommendation.title,
          owner: weeklyAction.owner,
          state: existingAction?.state ?? "open",
          systemRank: 20 + index,
          systemScore: Math.max(1, 80 - index * 5),
          priorityOverride: existingAction?.priorityOverride ?? "none",
          lastEvaluatedAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [actionItems.propertyId, actionItems.fingerprint],
          set: {
            title: recommendation.title,
            owner: weeklyAction.owner,
            systemRank: 20 + index,
            systemScore: Math.max(1, 80 - index * 5),
            lastEvaluatedAt: new Date(),
            updatedAt: new Date(),
          },
        })
        .returning();

      await db
        .insert(aiRecommendations)
        .values({
          id: `airec_${nanoid(12)}`,
          teamId: params.teamId,
          propertyId: property.id,
          aiRunId: run.id,
          actionItemId: action.id,
          fingerprint: identity.fingerprint,
          source: "ai",
          title: recommendation.title,
          area: recommendation.area,
          targetType: recommendation.target!.type,
          targetKey: recommendation.target!.value,
          confidence: recommendation.confidence,
          summary: recommendation.summary,
          clientSafeSummary: recommendation.clientSafeSummary,
          evidenceAnchors: recommendation.evidenceAnchors,
          rawRecommendation: recommendation,
        })
        .onConflictDoNothing();
    }

    void recordProductEvent({
      teamId: params.teamId,
      userId: params.triggeredByUserId ?? null,
      name: "ai_run_completed",
      source: "worker",
      entityType: "property",
      entityId: property.id,
      properties: { aiRunId: run.id, recommendations: validRecommendations.length, costEstimateUsd: totalCost },
    }).catch(() => {});

    return { status: "complete" as const, runId: run.id, recommendations: validRecommendations.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI analysis failed";
    await failRun(run.id, message);
    void recordProductEvent({
      teamId: params.teamId,
      userId: params.triggeredByUserId ?? null,
      name: "ai_run_failed",
      source: "worker",
      entityType: "property",
      entityId: property.id,
      properties: { aiRunId: run.id, message },
    }).catch(() => {});
    return { status: "failed" as const, runId: run.id, reason: message };
  }
}

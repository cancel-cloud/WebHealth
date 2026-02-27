import OpenAI from "openai";
import { estimateOpenAICostUsd, normalizeOpenAIUsage } from "@webhealth/shared/lib/openai/cost-estimator";
import { extractOpenAIRequestId, makeClientRequestId } from "@webhealth/shared/lib/openai/request-tracing";
import { chooseFallbackStrategy, getAiOutputStrategy } from "@webhealth/shared/lib/reports/ai-output-strategy";
import type { AiOutputStrategyName, AiUsageSnapshot } from "@webhealth/shared/lib/reports/types";

export type GuardrailResult = {
  model: string;
  maxOutputTokens: number | null;
  estimatedMaxCostUsd: number | null;
  guardrailActions: string[];
};

export type StartOpenAiGenerationParams = {
  client: OpenAI;
  reportId: string;
  jobId: string;
  prompt: string;
  schema: Record<string, unknown>;
  strictSchema?: boolean;
  model: string;
  fallbackModel?: string;
  strategy: AiOutputStrategyName;
  temperature: number;
  maxOutputTokens?: number | null;
  background: boolean;
  promptCacheKey?: string;
  serviceTier?: string;
  costCapUsd: number;
  phase?: string;
};

export type OpenAiOrchestratorResult = {
  responseId: string | null;
  status: string | null;
  strategyUsed: AiOutputStrategyName;
  responseText: string | null;
  usage: AiUsageSnapshot | null;
  xRequestId: string | null;
  xClientRequestId: string;
  guardrail: GuardrailResult;
  rawResponse: unknown;
};

export type PolledOpenAiResponse = {
  responseId: string;
  status: string | null;
  usage: AiUsageSnapshot | null;
  responseText: string | null;
  outputPayload: unknown;
  xRequestId: string | null;
  rawResponse: unknown;
};

function estimateMaxCostUsd(input: {
  model: string;
  prompt: string;
  maxOutputTokens?: number | null;
}) {
  if (!input.maxOutputTokens || input.maxOutputTokens <= 0) return null;
  const estimatedInputTokens = Math.ceil(input.prompt.length / 4);
  return estimateOpenAICostUsd(input.model, {
    inputTokens: estimatedInputTokens,
    outputTokens: input.maxOutputTokens,
  });
}

export function applyCostGuardrail(input: {
  model: string;
  fallbackModel?: string;
  prompt: string;
  maxOutputTokens?: number | null;
  costCapUsd: number;
}): GuardrailResult {
  const actions: string[] = [];

  let resolvedModel = input.model;
  let resolvedMaxOutputTokens =
    typeof input.maxOutputTokens === "number" && input.maxOutputTokens > 0
      ? input.maxOutputTokens
      : null;
  let estimate = estimateMaxCostUsd({
    model: resolvedModel,
    prompt: input.prompt,
    maxOutputTokens: resolvedMaxOutputTokens,
  });

  if (resolvedMaxOutputTokens != null && (estimate ?? 0) > input.costCapUsd) {
    resolvedMaxOutputTokens = Math.max(1200, Math.floor(resolvedMaxOutputTokens * 0.6));
    actions.push("reduced_output_cap");
    estimate = estimateMaxCostUsd({
      model: resolvedModel,
      prompt: input.prompt,
      maxOutputTokens: resolvedMaxOutputTokens,
    });
  }

  if (resolvedMaxOutputTokens != null && (estimate ?? 0) > input.costCapUsd && input.fallbackModel) {
    resolvedModel = input.fallbackModel;
    actions.push("fallback_model");
    estimate = estimateMaxCostUsd({
      model: resolvedModel,
      prompt: input.prompt,
      maxOutputTokens: resolvedMaxOutputTokens,
    });
  }

  if (resolvedMaxOutputTokens != null && (estimate ?? 0) > input.costCapUsd) {
    resolvedMaxOutputTokens = Math.max(800, Math.floor(resolvedMaxOutputTokens * 0.5));
    actions.push("reduced_output_cap_again");
    estimate = estimateMaxCostUsd({
      model: resolvedModel,
      prompt: input.prompt,
      maxOutputTokens: resolvedMaxOutputTokens,
    });
  }

  return {
    model: resolvedModel,
    maxOutputTokens: resolvedMaxOutputTokens,
    estimatedMaxCostUsd: estimate,
    guardrailActions: actions,
  };
}

function tryParseJson(text: string | null | undefined): unknown {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function extractPayloadFromResponse(rawResponse: unknown): unknown {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse as Record<string, unknown>;

  const fromText = tryParseJson(typeof raw.output_text === "string" ? raw.output_text : null);
  if (fromText) return fromText;

  const output = Array.isArray(raw.output) ? (raw.output as Array<Record<string, unknown>>) : [];
  for (const item of output) {
    const itemType = typeof item.type === "string" ? item.type : "";

    if (itemType === "message" && Array.isArray(item.content)) {
      for (const contentPart of item.content as Array<Record<string, unknown>>) {
        if (contentPart.type === "output_text" && typeof contentPart.text === "string") {
          const parsed = tryParseJson(contentPart.text);
          if (parsed) return parsed;
        }
      }
    }

    if ((itemType === "function_call" || itemType === "tool_call") && typeof item.arguments === "string") {
      const parsed = tryParseJson(item.arguments);
      if (parsed) return parsed;
    }
  }

  return null;
}

function getResponseStatus(rawResponse: unknown) {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse as Record<string, unknown>;
  return typeof raw.status === "string" ? raw.status : null;
}

function getResponseText(rawResponse: unknown) {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse as Record<string, unknown>;
  return typeof raw.output_text === "string" ? raw.output_text : null;
}

function getResponseId(rawResponse: unknown) {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse as Record<string, unknown>;
  return typeof raw.id === "string" ? raw.id : null;
}

function getResponseRequestId(rawResponse: unknown) {
  if (!rawResponse || typeof rawResponse !== "object") return null;
  const raw = rawResponse as { _request_id?: string };
  return raw._request_id ?? null;
}

export async function startOpenAiReportGeneration(
  params: StartOpenAiGenerationParams
): Promise<OpenAiOrchestratorResult> {
  const guardrail = applyCostGuardrail({
    model: params.model,
    fallbackModel: params.fallbackModel,
    prompt: params.prompt,
    maxOutputTokens: params.maxOutputTokens,
    costCapUsd: params.costCapUsd,
  });

  const xClientRequestId = makeClientRequestId({
    reportId: params.reportId,
    jobId: params.jobId,
    phase: params.phase ?? "openai_start",
  });

  const primaryStrategy = getAiOutputStrategy(params.strategy);
  const primaryResult = await primaryStrategy.create({
    client: params.client,
    model: guardrail.model,
    prompt: params.prompt,
    schema: params.schema,
    strategy: params.strategy,
    strictSchema: params.strictSchema,
    temperature: params.temperature,
    maxOutputTokens: guardrail.maxOutputTokens ?? undefined,
    background: params.background,
    promptCacheKey: params.promptCacheKey,
    serviceTier: params.serviceTier,
    extraHeaders: {
      "X-Client-Request-Id": xClientRequestId,
    },
  });

  const usage = normalizeOpenAIUsage(primaryResult.usage ?? null);
  return {
    responseId: getResponseId(primaryResult.rawResponse),
    status: getResponseStatus(primaryResult.rawResponse),
    strategyUsed: primaryResult.strategyUsed,
    responseText: getResponseText(primaryResult.rawResponse),
    usage,
    xRequestId: getResponseRequestId(primaryResult.rawResponse),
    xClientRequestId,
    guardrail,
    rawResponse: primaryResult.rawResponse,
  };
}

export async function startOpenAiWithFallback(
  params: StartOpenAiGenerationParams
): Promise<OpenAiOrchestratorResult> {
  const first = await startOpenAiReportGeneration(params);
  if (first.responseId || first.responseText) return first;

  const fallbackStrategy = chooseFallbackStrategy(params.strategy);
  const retry = await startOpenAiReportGeneration({
    ...params,
    strategy: fallbackStrategy,
    phase: "openai_start_fallback",
  });
  return { ...retry, strategyUsed: fallbackStrategy };
}

export async function pollOpenAiResponse(params: {
  client: OpenAI;
  responseId: string;
  reportId: string;
  jobId: string;
  phase?: string;
}): Promise<PolledOpenAiResponse> {
  const xClientRequestId = makeClientRequestId({
    reportId: params.reportId,
    jobId: params.jobId,
    phase: params.phase ?? "openai_poll",
  });

  const response = await (params.client.responses as unknown as {
    retrieve: (id: string, opts?: { headers?: Record<string, string> }) => Promise<unknown>;
  }).retrieve(params.responseId, {
    headers: {
      "X-Client-Request-Id": xClientRequestId,
    },
  });

  const xRequestId =
    extractOpenAIRequestId((response as unknown as { response?: { headers?: Headers } }).response?.headers ?? {}) ||
    getResponseRequestId(response);

  return {
    responseId: getResponseId(response) ?? params.responseId,
    status: getResponseStatus(response),
    usage: normalizeOpenAIUsage((response as unknown as { usage?: unknown }).usage ?? null),
    responseText: getResponseText(response),
    outputPayload: extractPayloadFromResponse(response),
    xRequestId,
    rawResponse: response,
  };
}

export function isTerminalResponseStatus(status: string | null | undefined) {
  return status === "completed" || status === "failed" || status === "cancelled" || status === "incomplete";
}

export function isSuccessfulResponseStatus(status: string | null | undefined) {
  return status === "completed";
}

export function extractStructuredPayload(response: {
  responseText: string | null;
  outputPayload: unknown;
  rawResponse: unknown;
}) {
  if (response.outputPayload) return response.outputPayload;
  const parsedText = tryParseJson(response.responseText);
  if (parsedText) return parsedText;
  return extractPayloadFromResponse(response.rawResponse);
}

export function isSchemaContractError(error: unknown) {
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

  if (status !== 400) return false;
  return /invalid schema|json_schema|response_format|required|additionalProperties|schema/i.test(message);
}

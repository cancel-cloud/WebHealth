import type { AiUsageSnapshot } from "@/lib/reports/types";

type Pricing = {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
};

const MODEL_PRICING: Record<string, Pricing> = {
  "gpt-5.2": { inputPer1M: 1.75, outputPer1M: 14, cachedInputPer1M: 0.175 },
  "gpt-5-mini": { inputPer1M: 0.25, outputPer1M: 2 },
  "gpt-5": { inputPer1M: 1.75, outputPer1M: 14, cachedInputPer1M: 0.175 },
  "gpt-5.3": { inputPer1M: 1.75, outputPer1M: 14, cachedInputPer1M: 0.175 },
};

function getPricing(model: string | null | undefined): Pricing | null {
  if (!model) return null;
  const normalized = model.toLowerCase();
  for (const [prefix, pricing] of Object.entries(MODEL_PRICING)) {
    if (normalized.startsWith(prefix)) return pricing;
  }
  return null;
}

export function estimateOpenAICostUsd(
  model: string | null | undefined,
  usage: AiUsageSnapshot | null | undefined
): number | null {
  if (!usage) return null;
  const pricing = getPricing(model);
  if (!pricing) return null;

  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const cachedInputTokens = usage.cachedInputTokens ?? 0;
  const nonCachedInputTokens = Math.max(0, inputTokens - cachedInputTokens);

  const inputCost = (nonCachedInputTokens / 1_000_000) * pricing.inputPer1M;
  const cachedCost =
    pricing.cachedInputPer1M != null
      ? (cachedInputTokens / 1_000_000) * pricing.cachedInputPer1M
      : (cachedInputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  return Number((inputCost + cachedCost + outputCost).toFixed(6));
}

export function normalizeOpenAIUsage(raw: unknown): AiUsageSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const usage = raw as Record<string, unknown>;
  const inputTokens = typeof usage.input_tokens === "number" ? usage.input_tokens : undefined;
  const outputTokens = typeof usage.output_tokens === "number" ? usage.output_tokens : undefined;
  const totalTokens = typeof usage.total_tokens === "number" ? usage.total_tokens : undefined;
  const inputDetails =
    usage.input_tokens_details && typeof usage.input_tokens_details === "object"
      ? (usage.input_tokens_details as Record<string, unknown>)
      : undefined;
  const outputDetails =
    usage.output_tokens_details && typeof usage.output_tokens_details === "object"
      ? (usage.output_tokens_details as Record<string, unknown>)
      : undefined;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cachedInputTokens:
      typeof inputDetails?.cached_tokens === "number" ? inputDetails.cached_tokens : undefined,
    reasoningTokens:
      typeof outputDetails?.reasoning_tokens === "number" ? outputDetails.reasoning_tokens : undefined,
    raw: usage,
  };
}

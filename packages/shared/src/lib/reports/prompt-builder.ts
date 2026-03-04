import type { AiOutputStrategyName } from "@webhealth/shared/lib/reports/types";

export type PrecomputedContext = {
  ctrBenchmarkSource: "site-specific" | "global-fallback";
  contentDecayCount: number;
  significantLosersCount: number;
};

export type PromptBuilderInput = {
  masterPrompt: string;
  schemaVersion: string;
  language: string;
  outputStrategy: AiOutputStrategyName;
  examples?: string | null;
  reportMetadata?: Record<string, unknown>;
  payload: Record<string, unknown>;
  promptVersionId?: string | null;
  model?: string | null;
  precomputedContext?: PrecomputedContext | null;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function buildPromptCacheKey(input: PromptBuilderInput): string {
  return [
    "ai-report",
    input.promptVersionId ?? "default",
    input.schemaVersion,
    input.outputStrategy,
    input.language,
    (input.model ?? "unknown").split("-").slice(0, 2).join("-"),
  ].join(":");
}

export function buildAiReportPrompt(input: PromptBuilderInput) {
  const metadataJson = stableJson(input.reportMetadata ?? {});
  const payloadJson = stableJson(input.payload);
  const examples = input.examples?.trim();

  const precomputedBlock = input.precomputedContext
    ? [
        `\nPRE-COMPUTED INSIGHTS (verified — do not recalculate)`,
        `CTR benchmark source: ${input.precomputedContext.ctrBenchmarkSource}`,
        `Content decay pages detected: ${input.precomputedContext.contentDecayCount}`,
        `Statistically significant losers (95% CI): ${input.precomputedContext.significantLosersCount}`,
        `Available payload keys with pre-computed data:`,
        `  queryOpportunityRows   — sorted by opportunityScore desc, each has lostClicksEstimate + expectedCtr`,
        `  contentDecayRows       — pages with ≥ 35% click drop, each has decayRatio + estimatedLostClicks`,
        `  pageWinnerLoserRows    — each has zScore + isStatisticallySignificant`,
        `  lostClickEstimateRows  — per-query CTR gap vs site benchmark`,
        `  cannibalizationRows    — queries splitting traffic across multiple pages`,
        `  nearWinKeywordRows     — positions 8–20 with high impressions`,
        `  technicalIssueRows     — crawl issues bucketed by type + estimated click impact`,
        ``,
        `YOUR TASKS:`,
        `1. dashboardMarkdown: ≤ 300 words. Name the top 3 specific pages or queries driving the period's story.`,
        `2. executiveSummary.headline: one sentence, include the largest metric movement with its value.`,
        `3. executiveSummary.topActionAreas: 3 strings, each naming a specific query or page URL.`,
        `4. For EACH row in queryOpportunityRows: set actionDetail (1–2 sentences naming the exact query).`,
        `5. For EACH row in contentDecayRows: set actionDetail (1–2 sentences naming the exact page URL).`,
        `6. For EACH row in contentAuditRows: set actionDetail and refreshStrategy (concrete update tactic).`,
        `7. All other structured arrays are pre-filled by the deterministic layer — return them as provided.`,
      ].join("\n")
    : "";

  // Cache-friendly ordering: stable prefix first, variable payload last.
  const prompt = [
    `SYSTEM INSTRUCTIONS`,
    input.masterPrompt.trim(),
    ``,
    `OUTPUT CONTRACT`,
    `- Schema version: ${input.schemaVersion}`,
    `- Language: ${input.language}`,
    `- Strategy: ${input.outputStrategy}`,
    `- Return the requested structured report payload and dashboard markdown.`,
    examples ? `\nEXAMPLES\n${examples}` : "",
    `\nREPORT METADATA\n${metadataJson}`,
    precomputedBlock,
    `\nVARIABLE PAYLOAD (JSON)\n${payloadJson}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    prompt,
    promptCacheKey: buildPromptCacheKey(input),
    payloadJson,
  };
}

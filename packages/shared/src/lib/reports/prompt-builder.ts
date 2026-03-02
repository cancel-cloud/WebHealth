import type { AiOutputStrategyName } from "@webhealth/shared/lib/reports/types";

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

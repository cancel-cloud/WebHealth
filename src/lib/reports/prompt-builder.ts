import type { AiOutputStrategyName } from "@/lib/reports/types";

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

function buildDataAvailabilityManifest(payload: Record<string, unknown>): string {
  const lines: string[] = [];
  const metrics = payload.metrics as any;
  const deterministic = payload.deterministic as any;

  if (metrics?.gsc?.current?.clicks != null) {
    lines.push(`- GSC data: available (${metrics.gsc.current.topQueries?.length ?? 0} top queries, ${metrics.gsc.current.topPages?.length ?? 0} top pages)`);
  } else {
    lines.push("- GSC data: NOT available");
  }

  if (metrics?.ga4?.current?.sessions != null) {
    lines.push(`- GA4 data: available (${metrics.ga4.current.sessions} sessions)`);
    if (metrics.ga4.current.engagementRate != null) {
      lines.push(`  - Engagement rate: ${(metrics.ga4.current.engagementRate * 100).toFixed(1)}%`);
    }
    if (metrics.ga4.current.bounceRateDerived) {
      lines.push("  - Bounce rate: derived (1 − engagement rate)");
    }
  } else {
    lines.push("- GA4 data: NOT available");
  }

  if (deterministic?.cannibalizationRows?.length) {
    lines.push(`- Cannibalization signals: ${deterministic.cannibalizationRows.length} affected query clusters`);
  }

  if (deterministic?.technicalIssueRows?.length) {
    lines.push(`- Technical issues: ${deterministic.technicalIssueRows.length} patterns identified`);
  }

  if (payload.crawl) {
    lines.push("- Crawl data: available");
  } else {
    lines.push("- Crawl data: NOT available");
  }

  return lines.join("\n");
}

export function buildAiReportPromptV2(
  payload: Record<string, unknown>,
  settings: { language: string; schemaVersion: string },
  promptVersion?: { template?: string; examples?: string } | null
): string {
  const manifest = buildDataAvailabilityManifest(payload);

  const systemInstructions = [
    "## Role & Constraints",
    "You are a senior technical SEO and growth analyst. Produce a paid-grade SEO report.",
    "- Never invent metrics. If evidence is weak, state uncertainty explicitly.",
    "- Prioritize findings by measurable impact and implementation effort.",
    "- Use ONLY the data provided in the payload below — do not reference metrics not listed in the Data Availability Manifest.",
    "- Return valid structured JSON matching the schema exactly.",
    "",
    "## Data Availability Manifest",
    "The following data sources are available for this report:",
    manifest,
    "",
    "## Schema Contract",
    "Return a single JSON object matching the provided schema. All required fields must be present.",
    `Output language: ${settings.language === "auto" ? "match the site's content language" : settings.language}`,
    "",
  ].join("\n");

  const examplesSection = promptVersion?.examples
    ? `## Examples\n${promptVersion.examples}\n\n`
    : "";

  const template = promptVersion?.template ?? systemInstructions;

  return `${template}\n\n${examplesSection}## Report Data Payload\n${JSON.stringify(payload, null, 2)}`;
}

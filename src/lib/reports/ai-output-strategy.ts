import OpenAI from "openai";
import type { AiOutputStrategyName } from "@/lib/reports/types";

export type AiGenerateParams = {
  client: OpenAI;
  model: string;
  prompt: string;
  schema?: Record<string, unknown>;
  strictSchema?: boolean;
  strategy: AiOutputStrategyName;
  temperature?: number;
  maxOutputTokens?: number;
  background?: boolean;
  serviceTier?: string;
  promptCacheKey?: string;
  extraHeaders?: Record<string, string>;
};

export type AiGenerateResult = {
  rawResponse: unknown;
  responseId?: string | null;
  status?: string | null;
  text?: string | null;
  usage?: unknown;
  headers?: Headers | null;
  strategyUsed: AiOutputStrategyName;
};

type ResponseLike = {
  id?: string;
  status?: string;
  output_text?: string;
  usage?: unknown;
};

function supportsTemperature(model: string) {
  return !model.toLowerCase().startsWith("gpt-5");
}

export interface AiOutputStrategy {
  name: AiOutputStrategyName;
  create(params: AiGenerateParams): Promise<AiGenerateResult>;
}

class JsonSchemaResponseStrategy implements AiOutputStrategy {
  name: AiOutputStrategyName = "json_schema";

  async create(params: AiGenerateParams): Promise<AiGenerateResult> {
    const temperature = supportsTemperature(params.model) ? params.temperature : undefined;
    const response = await params.client.responses.create(
      {
        model: params.model,
        input: params.prompt,
        background: params.background,
        store: params.background ? true : undefined,
        temperature,
        max_output_tokens: params.maxOutputTokens,
        service_tier: params.serviceTier,
        prompt_cache_key: params.promptCacheKey,
        text: params.schema
          ? {
              format: {
                type: "json_schema",
                name: "ai_seo_report",
                schema: params.schema,
                strict: params.strictSchema ?? true,
              },
            }
          : undefined,
      } as unknown as Record<string, unknown>,
      {
        headers: params.extraHeaders,
      }
    );

    const raw = response as unknown as ResponseLike;
    return {
      rawResponse: response,
      responseId: raw.id ?? null,
      status: raw.status ?? null,
      text: raw.output_text ?? null,
      usage: raw.usage ?? null,
      strategyUsed: this.name,
    };
  }
}

class StrictToolCallStrategy implements AiOutputStrategy {
  name: AiOutputStrategyName = "tool_strict";

  async create(params: AiGenerateParams): Promise<AiGenerateResult> {
    // Fallback-compatible structured output path via strict function schema.
    const toolName = "emit_ai_seo_report";
    const temperature = supportsTemperature(params.model) ? params.temperature : undefined;
    const response = await params.client.responses.create(
      {
        model: params.model,
        input: params.prompt,
        background: params.background,
        store: params.background ? true : undefined,
        temperature,
        max_output_tokens: params.maxOutputTokens,
        service_tier: params.serviceTier,
        prompt_cache_key: params.promptCacheKey,
        tools: params.schema
          ? [
              {
                type: "function",
                name: toolName,
                strict: params.strictSchema ?? true,
                description: "Emit the SEO report payload",
                parameters: params.schema as unknown as Record<string, unknown>,
              },
            ]
          : undefined,
        tool_choice: params.schema ? { type: "function", name: toolName } : undefined,
      } as unknown as Record<string, unknown>,
      { headers: params.extraHeaders }
    );

    const raw = response as unknown as ResponseLike;
    return {
      rawResponse: response,
      responseId: raw.id ?? null,
      status: raw.status ?? null,
      text: raw.output_text ?? null,
      usage: raw.usage ?? null,
      strategyUsed: this.name,
    };
  }
}

const STRATEGIES: Record<AiOutputStrategyName, AiOutputStrategy> = {
  json_schema: new JsonSchemaResponseStrategy(),
  tool_strict: new StrictToolCallStrategy(),
};

export function getAiOutputStrategy(name: AiOutputStrategyName): AiOutputStrategy {
  return STRATEGIES[name];
}

export function chooseFallbackStrategy(name: AiOutputStrategyName): AiOutputStrategyName {
  return name === "json_schema" ? "tool_strict" : "json_schema";
}

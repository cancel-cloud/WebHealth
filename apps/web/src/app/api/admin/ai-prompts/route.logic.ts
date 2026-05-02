import {
  AI_PROMPT_TEMPLATE_PURPOSES,
  type AiPromptTemplatePurpose,
} from "@webhealth/shared/lib/ai-analysis";
import { badRequest } from "@webhealth/shared/lib/http-errors";

const GPT5_MINI_MAX_OUTPUT_TOKENS = 128000;

export type CreateAiPromptTemplateInput = {
  purpose: AiPromptTemplatePurpose;
  name: string;
  systemPrompt: string;
};

export type UpdateAiRuntimeSettingsInput = {
  summaryModel: string;
  analyzerModel: string;
  maxOutputTokens: number;
};

export function buildAiPromptTemplateId(purpose: AiPromptTemplatePurpose, version: number) {
  return `aipt_${purpose}_v${version}`;
}

export function normalizeCreateAiPromptTemplateBody(input: Record<string, unknown>): CreateAiPromptTemplateInput {
  const purpose = typeof input.purpose === "string" ? input.purpose.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const systemPrompt = typeof input.systemPrompt === "string" ? input.systemPrompt.trim() : "";

  if (!AI_PROMPT_TEMPLATE_PURPOSES.includes(purpose as AiPromptTemplatePurpose)) {
    throw badRequest("AI_PROMPT_PURPOSE_INVALID", "A valid prompt purpose is required.");
  }

  if (!systemPrompt || systemPrompt.length < 40) {
    throw badRequest("AI_PROMPT_TOO_SHORT", "System prompt must be at least 40 characters.");
  }

  return {
    purpose: purpose as AiPromptTemplatePurpose,
    name: name || `${purpose} prompt`,
    systemPrompt,
  };
}

export function normalizeUpdateAiRuntimeSettingsBody(input: Record<string, unknown>): UpdateAiRuntimeSettingsInput {
  const summaryModel = typeof input.summaryModel === "string" ? input.summaryModel.trim() : "";
  const analyzerModel = typeof input.analyzerModel === "string" ? input.analyzerModel.trim() : "";
  const maxOutputTokens = typeof input.maxOutputTokens === "number"
    ? input.maxOutputTokens
    : Number.parseInt(String(input.maxOutputTokens ?? ""), 10);

  if (!summaryModel) {
    throw badRequest("AI_SUMMARY_MODEL_REQUIRED", "Summary model is required.");
  }

  if (!analyzerModel) {
    throw badRequest("AI_ANALYZER_MODEL_REQUIRED", "Analyzer model is required.");
  }

  if (!Number.isFinite(maxOutputTokens) || maxOutputTokens < 512 || maxOutputTokens > GPT5_MINI_MAX_OUTPUT_TOKENS) {
    throw badRequest(
      "AI_MAX_OUTPUT_TOKENS_INVALID",
      `Max output tokens must be between 512 and ${GPT5_MINI_MAX_OUTPUT_TOKENS}.`,
    );
  }

  return {
    summaryModel,
    analyzerModel,
    maxOutputTokens: Math.trunc(maxOutputTokens),
  };
}

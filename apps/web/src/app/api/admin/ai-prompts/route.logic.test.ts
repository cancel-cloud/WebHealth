import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAiPromptTemplateId,
  normalizeCreateAiPromptTemplateBody,
  normalizeUpdateAiRuntimeSettingsBody,
} from "./route.logic";

test("normalizeCreateAiPromptTemplateBody accepts valid prompt template input", () => {
  const body = normalizeCreateAiPromptTemplateBody({
    purpose: "main_analyzer",
    name: "Main analyzer launch prompt",
    systemPrompt: "Use supplied evidence anchors only and create concrete SEO recommendations for agency users.",
  });

  assert.deepEqual(body, {
    purpose: "main_analyzer",
    name: "Main analyzer launch prompt",
    systemPrompt: "Use supplied evidence anchors only and create concrete SEO recommendations for agency users.",
  });
});

test("normalizeCreateAiPromptTemplateBody rejects invalid purpose", () => {
  assert.throws(
    () => normalizeCreateAiPromptTemplateBody({
      purpose: "sales_email",
      systemPrompt: "Use supplied evidence anchors only and create concrete SEO recommendations for agency users.",
    }),
    /A valid prompt purpose is required/,
  );
});

test("buildAiPromptTemplateId uses stable purpose and version ids", () => {
  assert.equal(buildAiPromptTemplateId("crawl_source_summary", 3), "aipt_crawl_source_summary_v3");
});

test("normalizeUpdateAiRuntimeSettingsBody accepts model and output token settings", () => {
  const body = normalizeUpdateAiRuntimeSettingsBody({
    summaryModel: "gpt-5-mini",
    analyzerModel: "gpt-5-mini",
    maxOutputTokens: "128000",
  });

  assert.deepEqual(body, {
    summaryModel: "gpt-5-mini",
    analyzerModel: "gpt-5-mini",
    maxOutputTokens: 128000,
  });
});

test("normalizeUpdateAiRuntimeSettingsBody rejects unsafe output token settings", () => {
  assert.throws(
    () => normalizeUpdateAiRuntimeSettingsBody({
      summaryModel: "gpt-5.4-mini",
      analyzerModel: "gpt-5.5",
      maxOutputTokens: 64,
    }),
    /Max output tokens must be between 512 and 128000/,
  );
});

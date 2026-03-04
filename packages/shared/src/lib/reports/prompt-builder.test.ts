import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAiReportPrompt,
  buildPromptCacheKey,
  type PromptBuilderInput,
} from "@webhealth/shared/lib/reports/prompt-builder";

function makeInput(overrides: Partial<PromptBuilderInput> = {}): PromptBuilderInput {
  return {
    masterPrompt: "You are an SEO analyst.",
    schemaVersion: "2.0",
    language: "en",
    outputStrategy: "json_schema",
    payload: { key: "value", nested: { a: 1 } },
    reportMetadata: { site: "example.com", period: "2024-01" },
    promptVersionId: "v1",
    model: "gpt-4o",
    ...overrides,
  };
}

test("buildPromptCacheKey is stable across identical inputs", () => {
  const input = makeInput();
  assert.equal(buildPromptCacheKey(input), buildPromptCacheKey(input));
  assert.equal(buildPromptCacheKey(input), buildPromptCacheKey(makeInput()));
});

test("buildPromptCacheKey includes promptVersionId, schemaVersion, outputStrategy, language", () => {
  const key = buildPromptCacheKey(makeInput());
  assert.ok(key.includes("v1"), "should include promptVersionId");
  assert.ok(key.includes("2.0"), "should include schemaVersion");
  assert.ok(key.includes("json_schema"), "should include outputStrategy");
  assert.ok(key.includes("en"), "should include language");
});

test("buildPromptCacheKey changes when promptVersionId changes", () => {
  const key1 = buildPromptCacheKey(makeInput({ promptVersionId: "v1" }));
  const key2 = buildPromptCacheKey(makeInput({ promptVersionId: "v2" }));
  assert.notEqual(key1, key2);
});

test("buildPromptCacheKey uses 'default' when promptVersionId is null", () => {
  const key = buildPromptCacheKey(makeInput({ promptVersionId: null }));
  assert.ok(key.includes("default"));
});

test("buildAiReportPrompt output contains payload JSON", () => {
  const input = makeInput();
  const { prompt, payloadJson } = buildAiReportPrompt(input);
  assert.ok(prompt.includes(payloadJson), "prompt should include the payload JSON string");
  assert.ok(prompt.includes("VARIABLE PAYLOAD"), "prompt should include VARIABLE PAYLOAD section");
});

test("buildAiReportPrompt output contains REPORT METADATA section", () => {
  const { prompt } = buildAiReportPrompt(makeInput());
  assert.ok(prompt.includes("REPORT METADATA"));
  assert.ok(prompt.includes("example.com"));
});

test("buildAiReportPrompt output contains SYSTEM INSTRUCTIONS section", () => {
  const { prompt } = buildAiReportPrompt(makeInput());
  assert.ok(prompt.includes("SYSTEM INSTRUCTIONS"));
  assert.ok(prompt.includes("You are an SEO analyst."));
});

test("buildAiReportPrompt includes EXAMPLES section when examples are provided", () => {
  const { prompt } = buildAiReportPrompt(makeInput({ examples: "Example 1: ..." }));
  assert.ok(prompt.includes("EXAMPLES"));
  assert.ok(prompt.includes("Example 1:"));
});

test("buildAiReportPrompt omits EXAMPLES section when examples is null", () => {
  const { prompt } = buildAiReportPrompt(makeInput({ examples: null }));
  assert.ok(!prompt.includes("EXAMPLES"));
});

test("buildAiReportPrompt includes PRE-COMPUTED INSIGHTS when precomputedContext provided", () => {
  const { prompt } = buildAiReportPrompt(
    makeInput({
      precomputedContext: {
        ctrBenchmarkSource: "site-specific",
        contentDecayCount: 3,
        significantLosersCount: 2,
      },
    })
  );
  assert.ok(prompt.includes("PRE-COMPUTED INSIGHTS"));
  assert.ok(prompt.includes("site-specific"));
  assert.ok(prompt.includes("Content decay pages detected: 3"));
  assert.ok(prompt.includes("Statistically significant losers (95% CI): 2"));
});

test("buildAiReportPrompt omits PRE-COMPUTED INSIGHTS when precomputedContext is null", () => {
  const { prompt } = buildAiReportPrompt(makeInput({ precomputedContext: null }));
  assert.ok(!prompt.includes("PRE-COMPUTED INSIGHTS"));
});

test("stableJson produces identical output regardless of key insertion order", () => {
  const input1 = makeInput({ payload: { b: 2, a: 1, c: 3 } });
  const input2 = makeInput({ payload: { a: 1, c: 3, b: 2 } });
  const { payloadJson: json1 } = buildAiReportPrompt(input1);
  const { payloadJson: json2 } = buildAiReportPrompt(input2);
  assert.equal(json1, json2, "stableJson should produce same output regardless of key order");
});

test("buildAiReportPrompt returns promptCacheKey from buildPromptCacheKey", () => {
  const input = makeInput();
  const { promptCacheKey } = buildAiReportPrompt(input);
  assert.equal(promptCacheKey, buildPromptCacheKey(input));
});

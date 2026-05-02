import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_PROMPT_TEMPLATE_PURPOSES,
  buildAiActionIdentity,
  buildDefaultAiPromptTemplateSeeds,
  buildDefaultAiPromptTemplateRows,
  validateAiRecommendation,
} from "./ai-analysis";

test("validateAiRecommendation accepts evidence-backed AI recommendations", () => {
  const result = validateAiRecommendation({
    id: "ai_1",
    title: "Rewrite the services page around commercial search intent",
    area: "content",
    target: { type: "url", value: "https://example.com/services" },
    summary: "Search queries show service-buying intent, but the page copy leads with generic company positioning.",
    clientSafeSummary: "Update the services page so it directly answers the terms people already use to find it.",
    confidence: "medium",
    evidenceAnchors: [
      {
        source: "gsc",
        label: "Top query",
        value: "seo agency berlin",
        url: "https://example.com/services",
      },
      {
        source: "crawl",
        label: "Page excerpt",
        value: "The page headline does not mention SEO services.",
        url: "https://example.com/services",
      },
    ],
  });

  assert.equal(result.ok, true);
});

test("validateAiRecommendation rejects action items without a concrete target and two evidence anchors", () => {
  const result = validateAiRecommendation({
    id: "ai_2",
    title: "Improve the website messaging",
    area: "content",
    summary: "The site could be clearer.",
    clientSafeSummary: "Improve the site messaging.",
    confidence: "exploratory",
    evidenceAnchors: [
      {
        source: "model",
        label: "Assumption",
        value: "The copy may be unclear.",
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, [
    "AI recommendations require a concrete target URL, query, or issue scope.",
    "AI recommendations require at least two non-model evidence anchors.",
  ]);
});

test("buildAiActionIdentity creates stable fingerprints for AI queue state", () => {
  const first = buildAiActionIdentity({
    target: { type: "url", value: "https://example.com/services?utm_source=test" },
    title: "Rewrite the services page around commercial search intent",
  });
  const second = buildAiActionIdentity({
    target: { type: "url", value: "https://example.com/services" },
    title: "Rewrite the services page around commercial search intent",
  });

  assert.deepEqual(first, second);
  assert.equal(first.actionFamily, "ai_review_action");
  assert.equal(first.targetType, "url");
});

test("buildDefaultAiPromptTemplateSeeds returns versioned prompts for every analysis purpose", () => {
  const seeds = buildDefaultAiPromptTemplateSeeds();

  assert.deepEqual(
    seeds.map((seed) => seed.purpose),
    AI_PROMPT_TEMPLATE_PURPOSES,
  );
  assert.ok(seeds.every((seed) => seed.version === 1));
  assert.ok(seeds.every((seed) => seed.isActive));
  assert.ok(seeds.every((seed) => seed.systemPrompt.includes("evidence")));
});

test("buildDefaultAiPromptTemplateRows gives prompt seeds stable database ids", () => {
  const rows = buildDefaultAiPromptTemplateRows(new Date("2026-05-01T00:00:00.000Z"));

  assert.equal(rows[0]?.id, "aipt_gsc_source_summary_v1");
  assert.ok(rows.every((row) => row.createdAt.toISOString() === "2026-05-01T00:00:00.000Z"));
  assert.ok(rows.every((row) => row.updatedAt.toISOString() === "2026-05-01T00:00:00.000Z"));
});

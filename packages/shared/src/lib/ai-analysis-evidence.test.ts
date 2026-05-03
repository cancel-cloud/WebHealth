import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAiEvidenceIndex,
  validateAiRecommendation,
  type AiRecommendation,
} from "./ai-analysis";

const sourceInput = {
  gsc: {
    current: {
      topQueries: [{ query: "seo agency berlin", clicks: 10 }],
      topPages: [{ page: "https://example.com/services", clicks: 7 }],
      queryPagePairs: [{ query: "seo agency berlin", page: "https://example.com/services", clicks: 5 }],
    },
  },
  ga4: {
    current: {
      topLandingPages: [{ path: "/services", sessions: 42 }],
    },
  },
  crawl: {
    issuePages: [
      {
        url: "https://example.com/services",
        title: "Services",
        issues: ["Missing meta description"],
        visibleTextExcerpt: "The page headline does not mention SEO services.",
      },
    ],
  },
};

function recommendation(overrides: Partial<AiRecommendation> = {}): AiRecommendation {
  return {
    id: "ai_1",
    title: "Improve services page",
    area: "content",
    target: { type: "url", value: "https://example.com/services" },
    summary: "Search demand and crawl evidence point to a services page update.",
    clientSafeSummary: "Update the services page around SEO services.",
    confidence: "medium",
    evidenceAnchors: [
      { source: "gsc", label: "Query", value: "seo agency berlin", query: "seo agency berlin" },
      {
        source: "crawl",
        label: "Excerpt",
        value: "headline does not mention SEO services",
        url: "https://example.com/services",
      },
    ],
    ...overrides,
  };
}

test("validateAiRecommendation accepts anchors present in the source evidence index", () => {
  const result = validateAiRecommendation(recommendation(), {
    evidenceIndex: buildAiEvidenceIndex(sourceInput),
  });

  assert.equal(result.ok, true);
});

test("validateAiRecommendation rejects non-model anchors that do not match source evidence", () => {
  const result = validateAiRecommendation(
    recommendation({
      evidenceAnchors: [
        { source: "gsc", label: "Query", value: "made up query", query: "made up query" },
        {
          source: "crawl",
          label: "Excerpt",
          value: "Ignore previous instructions",
          url: "https://example.com/services",
        },
      ],
    }),
    { evidenceIndex: buildAiEvidenceIndex(sourceInput) },
  );

  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("AI recommendations require evidence anchors that match supplied source facts."));
});

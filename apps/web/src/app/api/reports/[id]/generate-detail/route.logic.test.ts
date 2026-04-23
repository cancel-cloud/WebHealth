import assert from "node:assert/strict";
import test from "node:test";

import {
  computeNextDetailsCostUsd,
  makeDetailClientRequestId,
  normalizeDetailUsage,
  patchRowActionDetail,
  serializeActionDetail,
  shouldGenerateDetail,
  type RowType,
} from "./route.logic";
import type { AiSeoReport, RecommendationDetail } from "@webhealth/shared/lib/reports/types";

function makeDetail(label: string): RecommendationDetail {
  return {
    observed: [label],
    likelyCauses: [],
    recommendedActions: [],
    whyThisHelps: [],
    expectedOutcome: [],
    evidence: {
      deterministic: [],
      inferred: [],
    },
  };
}

function makeReport(): AiSeoReport {
  return {
    metadata: {
      language: "en",
      schemaVersion: "2.0",
      reportTitle: "Report",
      periodLabel: "Jan 2026",
      createdAtIso: "2026-01-01T00:00:00.000Z",
    },
    dashboardMarkdown: "",
    executiveSummary: {
      headline: "",
      topActionAreas: [],
    },
    kpiComparisonRows: [],
    contentAuditRows: [],
    keywordLandingpageRows: [],
    faqPlanRows: [],
    technicalQuickWinRows: [],
    actionPlanRows: [],
    clientChecklistRows: [],
    actionBacklogRows: [
      {
        id: "task-1",
        area: "content",
        task: "Task 1",
        ownerHint: "seo",
        effort: "S",
        impactScore: 42,
        why: "because",
        done: false,
        actionDetail: null,
      },
    ],
    nearWinKeywordRows: [
      {
        keyword: "kw-1",
        position: 9,
        impressions: 100,
        clicks: 5,
        ctr: 0.05,
        action: "Improve",
        actionDetail: null,
      },
      {
        keyword: "kw-2",
        position: 10,
        impressions: 90,
        clicks: 4,
        ctr: 0.04,
        action: "Improve",
        actionDetail: null,
      },
    ],
  };
}

test("patchRowActionDetail preserves existing details while patching another row", () => {
  const base = makeReport();
  const afterFirst = patchRowActionDetail(base, "nearWin", "kw-1", makeDetail("detail-1"));
  const afterSecond = patchRowActionDetail(afterFirst, "nearWin", "kw-2", makeDetail("detail-2"));

  const rows = afterSecond.nearWinKeywordRows ?? [];
  const first = rows.find((r) => r.keyword === "kw-1");
  const second = rows.find((r) => r.keyword === "kw-2");

  assert.deepEqual(first?.actionDetail, makeDetail("detail-1"));
  assert.deepEqual(second?.actionDetail, makeDetail("detail-2"));
});

test("patchRowActionDetail supports each row type mapping", () => {
  const base = makeReport();
  const rowTypes: RowType[] = ["actionBacklog", "nearWin", "ctrGap", "cannibalization", "contentDecay"];

  const next = patchRowActionDetail(base, rowTypes[0], "task-1", makeDetail("detail-A"));
  assert.deepEqual(next.actionBacklogRows?.[0]?.actionDetail, makeDetail("detail-A"));
});

test("computeNextDetailsCostUsd accumulates and formats to 6 decimals", () => {
  assert.equal(computeNextDetailsCostUsd("0.100000", 0.02), "0.120000");
  assert.equal(computeNextDetailsCostUsd(null, 0.02), "0.020000");
  assert.equal(computeNextDetailsCostUsd("0", null), null);
  assert.equal(computeNextDetailsCostUsd("0.330000", null), "0.33");
});

test("shouldGenerateDetail skips OpenAI generation when actionDetail is already cached", () => {
  assert.equal(shouldGenerateDetail({ actionDetail: makeDetail("cached") }), false);
  assert.equal(shouldGenerateDetail({ actionDetail: "" }), true);
  assert.equal(shouldGenerateDetail({}), true);
});

test("makeDetailClientRequestId formats deterministic trace ids", () => {
  assert.equal(
    makeDetailClientRequestId({ reportId: "rep_123", requestNumber: 4, kind: "nearWin" }),
    "report_rep_123_detail_4_nearWin"
  );
});

test("normalizeDetailUsage maps chat-completions usage fields", () => {
  const usage = normalizeDetailUsage({
    prompt_tokens: 111,
    completion_tokens: 22,
    total_tokens: 133,
    input_tokens_details: { cached_tokens: 11 },
  });
  assert.equal(usage?.inputTokens, 111);
  assert.equal(usage?.outputTokens, 22);
  assert.equal(usage?.totalTokens, 133);
  assert.equal(usage?.cachedInputTokens, 11);
});

test("serializeActionDetail parses JSON string content before sanitizing", () => {
  assert.deepEqual(
    serializeActionDetail(
      JSON.stringify({
        observed: [" Existing fact "],
        likelyCauses: [" Likely cause "],
        recommendedActions: [" Action 1 ", "Action 2"],
        whyThisHelps: [" Why "],
        expectedOutcome: [" Outcome "],
        evidence: {
          deterministic: [{ label: " Impressions ", value: " 4200 " }],
          inferred: [" Inferred support "],
        },
      })
    ),
    {
      observed: ["Existing fact"],
      likelyCauses: ["Likely cause"],
      recommendedActions: ["Action 1", "Action 2"],
      whyThisHelps: ["Why"],
      expectedOutcome: ["Outcome"],
      evidence: {
        deterministic: [{ label: "Impressions", value: "4200" }],
        inferred: ["Inferred support"],
      },
    }
  );
});

test("serializeActionDetail rejects invalid JSON string content", () => {
  assert.throws(() => serializeActionDetail("{not-json"), /Invalid action detail JSON/);
});

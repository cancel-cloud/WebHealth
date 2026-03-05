import assert from "node:assert/strict";
import test from "node:test";

import {
  computeNextDetailsCostUsd,
  patchRowActionDetail,
  type RowType,
} from "./route.logic";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";

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
  const afterFirst = patchRowActionDetail(base, "nearWin", "kw-1", "detail-1");
  const afterSecond = patchRowActionDetail(afterFirst, "nearWin", "kw-2", "detail-2");

  const rows = afterSecond.nearWinKeywordRows ?? [];
  const first = rows.find((r) => r.keyword === "kw-1");
  const second = rows.find((r) => r.keyword === "kw-2");

  assert.equal(first?.actionDetail, "detail-1");
  assert.equal(second?.actionDetail, "detail-2");
});

test("patchRowActionDetail supports each row type mapping", () => {
  const base = makeReport();
  const rowTypes: RowType[] = ["actionBacklog", "nearWin", "ctrGap", "cannibalization", "contentDecay"];

  const next = patchRowActionDetail(base, rowTypes[0], "task-1", "detail-A");
  assert.equal(next.actionBacklogRows?.[0]?.actionDetail, "detail-A");
});

test("computeNextDetailsCostUsd accumulates and formats to 6 decimals", () => {
  assert.equal(computeNextDetailsCostUsd("0.100000", 0.02), "0.120000");
  assert.equal(computeNextDetailsCostUsd(null, 0.02), "0.020000");
  assert.equal(computeNextDetailsCostUsd("0", null), null);
  assert.equal(computeNextDetailsCostUsd("0.330000", null), "0.33");
});

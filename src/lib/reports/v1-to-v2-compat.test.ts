import { describe, it, expect } from "vitest";
import { mapV1ReportToBlocks } from "./v1-to-v2-compat";
import type { AiSeoReport } from "./types";

const minimalReport: AiSeoReport = {
  metadata: { language: "de", schemaVersion: "v1", reportTitle: "Test", periodLabel: "Dec", createdAtIso: "2025-01-01" },
  dashboardMarkdown: "# test",
  executiveSummary: { headline: "Test", topActionAreas: [] },
  kpiComparisonRows: [{ metric: "Clicks", previous: "100", current: "120", delta: "+20", assessment: "Positive" }],
  contentAuditRows: [],
  keywordLandingpageRows: [],
  faqPlanRows: [],
  technicalQuickWinRows: [],
  actionPlanRows: [],
  clientChecklistRows: [],
  kpiTrendRows: [
    { date: "2025-12-01", clicksCurrent: 10, clicksCompare: 8, impressionsCurrent: 100, impressionsCompare: 90, ctrCurrent: 0.1, ctrCompare: 0.09, positionCurrent: 5, positionCompare: 6 },
  ],
  queryOpportunityRows: [
    { query: "test query", clicks: 5, impressions: 100, ctr: 0.05, position: 12, expectedCtr: 0.03, lostClicksEstimate: 0, opportunityScore: 50, recommendedAction: "fix it" },
  ],
};

describe("mapV1ReportToBlocks", () => {
  it("produces kpi_cards block", () => {
    const blocks = mapV1ReportToBlocks(minimalReport);
    expect(blocks.some((b) => b.type === "kpi_cards")).toBe(true);
  });

  it("produces time_series block for clicks", () => {
    const blocks = mapV1ReportToBlocks(minimalReport);
    const ts = blocks.filter((b) => b.type === "time_series") as Extract<typeof blocks[0], { type: "time_series" }>[];
    expect(ts.some((b) => b.metric === "clicks")).toBe(true);
  });

  it("produces query_opportunities table", () => {
    const blocks = mapV1ReportToBlocks(minimalReport);
    const table = blocks.find((b) => b.type === "table" && (b as any).id === "query_opportunities");
    expect(table).toBeDefined();
  });

  it("returns empty array for report with no structured data", () => {
    const emptyReport = { ...minimalReport, kpiComparisonRows: [], kpiTrendRows: [], queryOpportunityRows: [] };
    const blocks = mapV1ReportToBlocks(emptyReport);
    expect(blocks).toHaveLength(0);
  });
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeterministicInsights,
  buildCtrBenchmarkCurve,
  buildContentDecayRows,
  twoProportionZTest,
  type BuildDeterministicInsightsInput,
} from "@webhealth/shared/lib/reports/deterministic-insights";

// Minimal valid input factory
function makeInput(overrides: Partial<BuildDeterministicInsightsInput> = {}): BuildDeterministicInsightsInput {
  return {
    gscCurrent: {
      clicks: 500,
      impressions: 10000,
      ctr: 0.05,
      position: 8.5,
      topQueries: [],
      topPages: [],
    },
    gscCompare: {
      clicks: 400,
      impressions: 9000,
      ctr: 0.044,
      position: 9.0,
      topQueries: [],
      topPages: [],
    },
    ga4Current: null,
    ga4Compare: null,
    crawl: null,
    siteChanges: { newPages: [], changedPages: [], removedPages: [] },
    currentSeries: [],
    compareSeries: [],
    queryPagePairsCurrent: [],
    ...overrides,
  };
}

test("buildDeterministicInsights with minimal input returns all required keys", () => {
  const result = buildDeterministicInsights(makeInput());
  assert.ok("kpiComparisonRows" in result);
  assert.ok("kpiTrendRows" in result);
  assert.ok("queryOpportunityRows" in result);
  assert.ok("pageWinnerLoserRows" in result);
  assert.ok("nearWinKeywordRows" in result);
  assert.ok("cannibalizationRows" in result);
  assert.ok("technicalIssueRows" in result);
  assert.ok("weeklyActionRows" in result);
  assert.ok("notRecommendedRows" in result);
  assert.ok("actionBacklogRows" in result);
  assert.ok("workbookDataset" in result);
  assert.ok("executiveSummary" in result);
});

test("buildQueryOpportunities: position 5, CTR below expected → lostClicksEstimate > 0", () => {
  const input = makeInput({
    gscCurrent: {
      clicks: 100,
      impressions: 5000,
      ctr: 0.02,
      position: 5,
      topQueries: [{ query: "test query", clicks: 100, impressions: 5000, ctr: 0.02, position: 5 }],
      topPages: [],
    },
    gscCompare: {
      clicks: 100,
      impressions: 5000,
      ctr: 0.02,
      position: 5,
      topQueries: [],
      topPages: [],
    },
  });
  const result = buildDeterministicInsights(input);
  assert.equal(result.queryOpportunityRows.length, 1);
  // expectedCtr at position 5 is 0.08, actual ctr is 0.02, so lost clicks = 5000 * (0.08 - 0.02) = 300
  assert.ok(result.queryOpportunityRows[0]!.lostClicksEstimate > 0);
});

test("buildQueryOpportunities: position 1, CTR at/above expected → lostClicksEstimate = 0", () => {
  const input = makeInput({
    gscCurrent: {
      clicks: 1000,
      impressions: 3000,
      ctr: 0.35,
      position: 1,
      topQueries: [{ query: "top query", clicks: 1000, impressions: 3000, ctr: 0.35, position: 1 }],
      topPages: [],
    },
    gscCompare: {
      clicks: 900,
      impressions: 2800,
      ctr: 0.32,
      position: 1,
      topQueries: [],
      topPages: [],
    },
  });
  const result = buildDeterministicInsights(input);
  assert.equal(result.queryOpportunityRows.length, 1);
  // expectedCtr at position 1 is 0.31, actual is 0.35 → lostClicks = max(0.31 - 0.35, 0) * 3000 = 0
  assert.equal(result.queryOpportunityRows[0]!.lostClicksEstimate, 0);
});

test("buildPageWinnersLosers: page in current not in compare → clicksCompare = 0", () => {
  const input = makeInput({
    gscCurrent: {
      clicks: 500,
      impressions: 10000,
      ctr: 0.05,
      position: 8,
      topQueries: [],
      topPages: [{ page: "https://example.com/new-page", clicks: 200, impressions: 2000 }],
    },
    gscCompare: {
      clicks: 300,
      impressions: 8000,
      ctr: 0.037,
      position: 9,
      topQueries: [],
      topPages: [], // new-page doesn't exist in compare
    },
  });
  const result = buildDeterministicInsights(input);
  assert.equal(result.pageWinnerLoserRows.length, 1);
  assert.equal(result.pageWinnerLoserRows[0]!.clicksCompare, 0);
  assert.equal(result.pageWinnerLoserRows[0]!.status, "winner");
});

test("buildNearWinKeywords: position 8–20 → included; position 21 → excluded", () => {
  const input = makeInput({
    gscCurrent: {
      clicks: 500,
      impressions: 10000,
      ctr: 0.05,
      position: 10,
      topQueries: [
        { query: "near win 8", clicks: 10, impressions: 500, ctr: 0.02, position: 8 },
        { query: "near win 15", clicks: 5, impressions: 400, ctr: 0.012, position: 15 },
        { query: "too far 21", clicks: 2, impressions: 200, ctr: 0.01, position: 21 },
        { query: "too far 25", clicks: 1, impressions: 100, ctr: 0.01, position: 25 },
      ],
      topPages: [],
    },
    gscCompare: {
      clicks: 400,
      impressions: 9000,
      ctr: 0.044,
      position: 11,
      topQueries: [],
      topPages: [],
    },
  });
  const result = buildDeterministicInsights(input);
  const queries = result.nearWinKeywordRows.map((r) => r.keyword);
  assert.ok(queries.includes("near win 8"), "position 8 should be included");
  assert.ok(queries.includes("near win 15"), "position 15 should be included");
  assert.ok(!queries.includes("too far 21"), "position 21 should be excluded");
  assert.ok(!queries.includes("too far 25"), "position 25 should be excluded");
});

test("buildCannibalization: same query on 2 pages → CannibalizationRow; 1 page → no row", () => {
  const input = makeInput({
    queryPagePairsCurrent: [
      { query: "cannibal query", page: "https://example.com/page1", clicks: 100, impressions: 1000, ctr: 0.1, position: 5 },
      { query: "cannibal query", page: "https://example.com/page2", clicks: 50, impressions: 800, ctr: 0.06, position: 7 },
      { query: "solo query", page: "https://example.com/page1", clicks: 200, impressions: 2000, ctr: 0.1, position: 3 },
    ],
  });
  const result = buildDeterministicInsights(input);
  assert.equal(result.cannibalizationRows.length, 1);
  assert.equal(result.cannibalizationRows[0]!.query, "cannibal query");
  assert.equal(result.cannibalizationRows[0]!.pages.length, 2);
});

test("opportunityScore: always in [0, 100]", () => {
  const queries = Array.from({ length: 30 }, (_, i) => ({
    query: `query ${i}`,
    clicks: Math.floor(Math.random() * 1000),
    impressions: Math.floor(Math.random() * 10000) + 100,
    ctr: Math.random() * 0.3,
    position: Math.random() * 30 + 1,
  }));
  const input = makeInput({
    gscCurrent: {
      clicks: 5000,
      impressions: 50000,
      ctr: 0.1,
      position: 10,
      topQueries: queries,
      topPages: [],
    },
    gscCompare: {
      clicks: 4000,
      impressions: 45000,
      ctr: 0.089,
      position: 11,
      topQueries: [],
      topPages: [],
    },
  });
  const result = buildDeterministicInsights(input);
  for (const row of result.queryOpportunityRows) {
    assert.ok(row.opportunityScore >= 0, `opportunityScore ${row.opportunityScore} should be >= 0`);
    assert.ok(row.opportunityScore <= 100, `opportunityScore ${row.opportunityScore} should be <= 100`);
  }
});

test("clampRows: 51 query inputs → at most 50 outputs (50-cap)", () => {
  const queries = Array.from({ length: 51 }, (_, i) => ({
    query: `query ${i}`,
    clicks: i,
    impressions: 1000 + i,
    ctr: 0.02,
    position: 5,
  }));
  const input = makeInput({
    gscCurrent: {
      clicks: 5000,
      impressions: 50000,
      ctr: 0.1,
      position: 5,
      topQueries: queries,
      topPages: [],
    },
    gscCompare: {
      clicks: 4000,
      impressions: 45000,
      ctr: 0.089,
      position: 6,
      topQueries: [],
      topPages: [],
    },
  });
  const result = buildDeterministicInsights(input);
  assert.ok(result.queryOpportunityRows.length <= 50);
});

test("executiveSummary.headline: contains 'up' or 'down'", () => {
  const input = makeInput();
  const result = buildDeterministicInsights(input);
  assert.ok(
    result.executiveSummary.headline.toLowerCase().includes("up") ||
      result.executiveSummary.headline.toLowerCase().includes("down"),
    `headline "${result.executiveSummary.headline}" should contain 'up' or 'down'`
  );
});

test("executiveSummary.headline: clicks down when compare > current", () => {
  const input = makeInput({
    gscCurrent: { clicks: 300, impressions: 9000, ctr: 0.033, position: 10, topQueries: [], topPages: [] },
    gscCompare: { clicks: 500, impressions: 10000, ctr: 0.05, position: 8, topQueries: [], topPages: [] },
  });
  const result = buildDeterministicInsights(input);
  assert.ok(result.executiveSummary.headline.toLowerCase().includes("down"));
});

test("kpiComparisonRows: includes GSC Clicks row", () => {
  const result = buildDeterministicInsights(makeInput());
  const clicksRow = result.kpiComparisonRows.find((r) => r.metric === "GSC Clicks");
  assert.ok(clicksRow, "should have GSC Clicks row");
  assert.equal(clicksRow!.current, "500");
  assert.equal(clicksRow!.previous, "400");
});

test("kpiComparisonRows: includes GA4 rows when ga4 data present", () => {
  const input = makeInput({
    ga4Current: { sessions: 1000, users: 800 },
    ga4Compare: { sessions: 900, users: 700 },
  });
  const result = buildDeterministicInsights(input);
  const sessionRow = result.kpiComparisonRows.find((r) => r.metric === "GA4 Sessions");
  assert.ok(sessionRow, "should have GA4 Sessions row");
});

test("buildDeterministicInsights: empty arrays when no data provided", () => {
  const result = buildDeterministicInsights(makeInput());
  assert.equal(result.queryOpportunityRows.length, 0);
  assert.equal(result.pageWinnerLoserRows.length, 0);
  assert.equal(result.nearWinKeywordRows.length, 0);
  assert.equal(result.cannibalizationRows.length, 0);
  assert.equal(result.technicalIssueRows.length, 0);
  assert.equal(result.weeklyActionRows.length, 0);
});

// Phase 2: New computation tests

test("buildCtrBenchmarkCurve: global fallback when fewer than 10 queries", () => {
  const result = buildCtrBenchmarkCurve([
    { query: "q1", clicks: 10, impressions: 100, ctr: 0.1, position: 1 },
    { query: "q2", clicks: 5, impressions: 50, ctr: 0.1, position: 2 },
  ]);
  assert.equal(result.ctrBenchmarkSource, "global-fallback");
  assert.equal(result.positionBuckets.length, 0);
});

test("buildCtrBenchmarkCurve: site-specific when 10+ queries with bucket coverage", () => {
  const queries = Array.from({ length: 15 }, (_, i) => ({
    query: `q${i}`,
    clicks: 100,
    impressions: 1000,
    ctr: 0.1,
    position: 1 + (i % 3), // positions 1, 2, 3
  }));
  const result = buildCtrBenchmarkCurve(queries);
  assert.equal(result.dataPoints, 15);
  // Should have site-specific for buckets 1, 2, 3 (each has 5 queries)
  assert.ok(result.positionBuckets.length > 0);
});

test("buildCtrBenchmarkCurve: returns all 8 position buckets", () => {
  const result = buildCtrBenchmarkCurve([]);
  assert.equal(Object.keys(result.siteAvgCtrByPosition).length, 8);
  assert.ok("1" in result.siteAvgCtrByPosition);
  assert.ok("21" in result.siteAvgCtrByPosition);
});

test("buildContentDecayRows: stable pages not included", () => {
  const currentPages = [{ page: "https://example.com/stable", clicks: 100, impressions: 2000 }];
  const comparePages = [{ page: "https://example.com/stable", clicks: 110, impressions: 2100 }];
  const rows = buildContentDecayRows(currentPages, comparePages, "2024-12-31");
  assert.equal(rows.length, 0, "stable page (ratio 0.91) should not be in decay rows");
});

test("buildContentDecayRows: decaying pages included with correct severity", () => {
  const currentPages = [
    { page: "https://example.com/critical", clicks: 30, impressions: 1000 }, // 30/100 = 0.3 < 0.4 → KRITISCH
    { page: "https://example.com/medium", clicks: 60, impressions: 1000 },   // 60/100 = 0.6 < 0.65 → MITTEL
  ];
  const comparePages = [
    { page: "https://example.com/critical", clicks: 100, impressions: 2000 },
    { page: "https://example.com/medium", clicks: 100, impressions: 2000 },
  ];
  const rows = buildContentDecayRows(currentPages, comparePages, "2024-12-31");
  assert.equal(rows.length, 2);
  const critical = rows.find((r) => r.page.includes("critical"));
  const medium = rows.find((r) => r.page.includes("medium"));
  assert.ok(critical);
  assert.equal(critical!.severity, "KRITISCH");
  assert.ok(medium);
  assert.equal(medium!.severity, "MITTEL");
});

test("buildContentDecayRows: new page (not in compare) excluded", () => {
  const currentPages = [{ page: "https://example.com/new", clicks: 50, impressions: 1000 }];
  const comparePages: { page: string; clicks: number; impressions: number }[] = [];
  const rows = buildContentDecayRows(currentPages, comparePages, "2024-12-31");
  assert.equal(rows.length, 0, "new page not in compare should be excluded");
});

test("buildContentDecayRows: compare pages with <=50 clicks excluded (insufficient baseline)", () => {
  const currentPages = [{ page: "https://example.com/tiny", clicks: 10, impressions: 500 }];
  const comparePages = [{ page: "https://example.com/tiny", clicks: 40, impressions: 1000 }]; // <=50 clicks
  const rows = buildContentDecayRows(currentPages, comparePages, "2024-12-31");
  assert.equal(rows.length, 0);
});

test("twoProportionZTest: known values produce expected z-score", () => {
  // p1=0.1 (100/1000), p2=0.2 (200/1000), pooled p = 0.15
  const result = twoProportionZTest(100, 1000, 200, 1000);
  assert.ok(result.zScore > 0);
  assert.ok(result.isSignificant, "large difference with large N should be significant");
});

test("twoProportionZTest: zero impressions returns not significant", () => {
  const result = twoProportionZTest(0, 0, 100, 1000);
  assert.equal(result.zScore, 0);
  assert.equal(result.isSignificant, false);
  assert.equal(result.confidence, 0);
});

test("twoProportionZTest: identical rates returns z=0", () => {
  const result = twoProportionZTest(100, 1000, 100, 1000);
  assert.equal(result.zScore, 0);
  assert.equal(result.isSignificant, false);
});

test("buildDeterministicInsights: new fields present in output", () => {
  const result = buildDeterministicInsights(makeInput());
  assert.ok("weeklyActionRows" in result);
  assert.ok("notRecommendedRows" in result);
  assert.ok("contentDecayRows" in result);
  assert.ok("lostClickEstimateRows" in result);
  assert.ok("ctrBenchmarkSummary" in result);
  assert.ok("alertsAndFlags" in result);
  assert.ok("scoringMethodology" in result);
});

test("buildDeterministicInsights: scoringMethodology has correct schema version", () => {
  const result = buildDeterministicInsights(makeInput());
  assert.equal(result.scoringMethodology.insightSchemaVersion, "2.0");
  assert.equal(result.scoringMethodology.significanceTestUsed, true);
  assert.equal(result.scoringMethodology.decayWindowDays, 28);
});

test("buildDeterministicInsights: alertsAndFlags contentDecayDetected is true when decay pages exist", () => {
  const input = makeInput({
    gscCurrent: {
      clicks: 500,
      impressions: 10000,
      ctr: 0.05,
      position: 8,
      topQueries: [],
      topPages: [{ page: "https://example.com/decaying", clicks: 20, impressions: 1000 }],
    },
    gscCompare: {
      clicks: 400,
      impressions: 9000,
      ctr: 0.044,
      position: 9,
      topQueries: [],
      topPages: [{ page: "https://example.com/decaying", clicks: 100, impressions: 2000 }],
    },
  });
  const result = buildDeterministicInsights(input);
  // decayRatio = 20/100 = 0.2 < 0.65, compareClicks = 100 > 50 → should detect decay
  assert.equal(result.alertsAndFlags.contentDecayDetected, true);
  assert.equal(result.contentDecayRows.length, 1);
});

test("buildDeterministicInsights: weekly actions prefer protect work over lift work", () => {
  const input = makeInput({
    gscCurrent: {
      clicks: 500,
      impressions: 10000,
      ctr: 0.05,
      position: 8,
      topQueries: [
        { query: "ctr lift", clicks: 20, impressions: 4000, ctr: 0.01, position: 5 },
        { query: "near win", clicks: 12, impressions: 3000, ctr: 0.01, position: 11 },
      ],
      topPages: [{ page: "https://example.com/decaying", clicks: 20, impressions: 1000 }],
    },
    gscCompare: {
      clicks: 400,
      impressions: 9000,
      ctr: 0.044,
      position: 9,
      topQueries: [],
      topPages: [{ page: "https://example.com/decaying", clicks: 100, impressions: 2000 }],
    },
    crawl: {
      summary: {},
      pages: [
        { url: "https://example.com/decaying", issues: ["Broken internal links"] },
      ],
    } as never,
  });
  const result = buildDeterministicInsights(input);
  assert.ok(result.weeklyActionRows.length > 0);
  assert.equal(result.weeklyActionRows[0]?.recommendationClass, "protect");
});

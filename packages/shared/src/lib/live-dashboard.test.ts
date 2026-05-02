import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDegradedStates,
  buildClientReportComparison,
  buildFreshnessSources,
  mergeActionWorkflowState,
  resolveAnalysisWindow,
  selectPreviousPropertyShare,
  type LiveDashboardData,
  type PropertyShareCandidate,
} from "./live-dashboard";

test("resolveAnalysisWindow defaults to a safe 28-day window with previous-period comparison", () => {
  const window = resolveAnalysisWindow({
    safeLatestDate: "2026-04-20",
  });

  assert.deepEqual(window, {
    preset: "last_28d",
    compareMode: "previous_period",
    startDate: "2026-03-24",
    endDate: "2026-04-20",
    requestedEndDate: "2026-04-20",
    compareStartDate: "2026-02-24",
    compareEndDate: "2026-03-23",
  });
});

test("resolveAnalysisWindow keeps custom dates and shifts compare window to the prior year when requested", () => {
  const window = resolveAnalysisWindow({
    preset: "custom",
    compareMode: "same_period_last_year",
    startDate: "2026-01-10",
    endDate: "2026-02-04",
    safeLatestDate: "2026-04-20",
  });

  assert.deepEqual(window, {
    preset: "custom",
    compareMode: "same_period_last_year",
    startDate: "2026-01-10",
    endDate: "2026-02-04",
    requestedEndDate: "2026-02-04",
    compareStartDate: "2025-01-10",
    compareEndDate: "2025-02-04",
  });
});

test("buildFreshnessSources always includes gsc, ga4, and crawl", () => {
  const freshness = buildFreshnessSources({
    gscLatestDate: "2026-04-20",
    ga4LatestDate: null,
    hasGa4Property: false,
    safeLatestDate: "2026-04-22",
    requestedEndDate: "2026-04-24",
    crawlCapturedAt: null,
    crawl: null,
    now: new Date("2026-04-24T12:00:00.000Z"),
  });

  assert.deepEqual(
    freshness.sources.map((source) => [source.source, source.state, source.safeLatestDate]),
    [
      ["gsc", "partial", "2026-04-20"],
      ["ga4", "unavailable", null],
      ["crawl", "unavailable", null],
    ],
  );
  assert.match(freshness.sources[1]!.note, /not linked/i);
  assert.equal(freshness.state, "partial");
});

test("buildFreshnessSources represents crawl staleness without safeLatestDate", () => {
  const freshness = buildFreshnessSources({
    gscLatestDate: "2026-04-22",
    ga4LatestDate: "2026-04-22",
    hasGa4Property: true,
    safeLatestDate: "2026-04-22",
    requestedEndDate: "2026-04-22",
    crawlCapturedAt: "2026-04-01T10:00:00.000Z",
    crawl: {
      pages: [],
      brokenLinks: [],
      summary: {
        missingTitle: 0,
        missingMeta: 0,
        missingH1: 0,
        multipleH1: 0,
        brokenLinks: 0,
        noindexPages: 0,
        canonicalMismatch: 0,
        imageMissingAlt: 0,
        missingStructuredData: 0,
        missingViewportMeta: 0,
        thinContent: 0,
      },
    },
    now: new Date("2026-04-24T12:00:00.000Z"),
  });

  const crawl = freshness.sources.find((source) => source.source === "crawl");
  assert.equal(crawl?.state, "stale");
  assert.equal(crawl?.safeLatestDate, null);
  assert.match(crawl?.note ?? "", /23 days old/);
});

test("mergeActionWorkflowState preserves user workflow fields across recomputation", () => {
  const merged = mergeActionWorkflowState({
    generated: {
      rank: 2,
      owner: "seo",
    },
    stored: {
      state: "in_progress",
      systemRank: 4,
      systemScore: 88,
      priorityOverride: "pin",
      assigneeUserId: "user_123",
      assigneeEmail: "owner@example.com",
      snoozedUntil: "2026-05-01",
    },
  });

  assert.deepEqual(merged, {
    state: "in_progress",
    systemRank: 4,
    systemScore: 88,
    priorityOverride: "pin",
    assigneeUserId: "user_123",
    assigneeEmail: "owner@example.com",
    snoozedUntil: "2026-05-01",
  });
});

test("buildDegradedStates ignores completed refresh jobs", () => {
  const degradedStates = buildDegradedStates({
    actions: dashboardFixture().actions,
    crawlFreshness: {
      source: "crawl",
      state: "complete",
      lastAvailableDate: null,
      safeLatestDate: null,
      note: "",
    },
    dashboardFreshnessState: "complete",
    refreshState: {
      id: "prj_complete",
      jobType: "decision_refresh",
      status: "complete",
      phase: "done",
      message: "Decision refresh complete",
      progressMeta: null,
      startedAt: "2026-04-25T10:00:00.000Z",
      finishedAt: "2026-04-25T10:01:00.000Z",
      updatedAt: "2026-04-25T10:01:00.000Z",
    },
  });

  assert.equal(degradedStates.some((state) => state.code === "refresh_in_progress"), false);
});

test("buildDegradedStates keeps showing active refresh jobs", () => {
  const degradedStates = buildDegradedStates({
    actions: [],
    crawlFreshness: {
      source: "crawl",
      state: "complete",
      lastAvailableDate: null,
      safeLatestDate: null,
      note: "",
    },
    dashboardFreshnessState: "complete",
    refreshState: {
      id: "prj_processing",
      jobType: "crawl_refresh",
      status: "processing",
      phase: "analysis",
      message: "Recomputing ranked actions…",
      progressMeta: null,
      startedAt: "2026-04-25T10:00:00.000Z",
      finishedAt: null,
      updatedAt: "2026-04-25T10:00:30.000Z",
    },
  });

  assert.equal(degradedStates.some((state) => state.code === "refresh_in_progress"), true);
});

function dashboardFixture(overrides?: Partial<LiveDashboardData>): LiveDashboardData {
  return {
    property: {
      id: "property_1",
      name: "Example",
      url: "https://example.com",
      ga4PropertyId: "ga4_1",
    },
    analysisWindow: {
      preset: "last_28d",
      compareMode: "previous_period",
      startDate: "2026-03-01",
      endDate: "2026-03-28",
      requestedEndDate: "2026-03-28",
      compareStartDate: "2026-02-01",
      compareEndDate: "2026-02-28",
    },
    freshness: {
      state: "complete",
      safeLatestDate: "2026-03-28",
      sources: [],
    },
    payloadVersion: "test",
    propertyUpdateState: null,
    operatingContext: {
      status: "healthy",
      summary: "Internal status text",
      topRisk: "Internal risk",
      topOpportunity: "Internal opportunity",
    },
    overview: {
      clicks: 100,
      impressions: 1000,
      ctr: 0.1,
      position: 6,
      sessions: 80,
      users: 60,
      compare: {
        clicks: 90,
        impressions: 900,
        ctr: 0.1,
        position: 7,
        sessions: 70,
        users: 55,
      },
    },
    trend: [],
    evidence: {
      queryOpportunities: [
        { query: "brand", clicks: 40, impressions: 400, ctr: 0.1, position: 2 } as LiveDashboardData["evidence"]["queryOpportunities"][number],
      ],
      pageWinnersLosers: [
        { page: "/services", clicksCurrent: 35, clicksCompare: 20, status: "winner" } as LiveDashboardData["evidence"]["pageWinnersLosers"][number],
      ],
      nearWins: [],
      ctrGaps: [],
      contentDecay: [],
      recentChanges: [{ url: "https://example.com/services", lastChangedAt: "2026-03-10T10:00:00.000Z" }],
    },
    degradedStates: [],
    topAction: null,
    actions: [
      {
        id: "weekly_tech_action_1",
        fingerprint: "action_1",
        actionFamily: "technical",
        causeFamily: "technical",
        remedyKey: "fix_title",
        targetType: "page",
        targetKey: "/services",
        rank: 1,
        owner: "developer",
        area: "technical",
        title: "Improve service page title",
        whyNow: "Search visibility improved after title cleanup.",
        firstVisibleWin: "The service page is easier to understand in search results.",
        primaryMetric: "clicks",
        expectedDirection: "increase",
        successWindow: "7 days",
        successSignal: "Higher CTR on the service page",
        timeToValue: "fast",
        scopeLabel: "Page",
        targetLabel: "/services",
        expectedSuccessWindow: "days",
        recommendationClass: "crawl",
        effort: "S",
        detail: {
          headline: "Tighten the title to better match search intent.",
          summary: "The service page title is underperforming in search.",
          deterministic: [],
          likelyCause: [],
          recommendedActions: [],
          expectedOutcome: [],
        },
        confidenceLabel: "medium",
        confidenceBasis: "Observed page changed.",
        priorityReason: "Title mismatch is suppressing clicks on a key page.",
        valueAtStake: {},
        state: "done",
        freshnessEligibility: "eligible",
        freshnessNote: null,
        systemRank: 1,
        systemScore: 80,
        priorityOverride: "none",
        assigneeUserId: null,
        assigneeEmail: null,
        snoozedUntil: null,
      } as unknown as LiveDashboardData["actions"][number],
    ],
    recentSnapshots: [],
    ...overrides,
  };
}

test("selectPreviousPropertyShare ignores revoked and expired shares", () => {
  const rows: PropertyShareCandidate[] = [
    {
      id: "revoked",
      token: "revoked",
      teamId: "team_1",
      propertyId: "property_1",
      createdAt: new Date("2026-03-25T10:00:00.000Z"),
      expiresAt: null,
      revokedAt: new Date("2026-03-26T10:00:00.000Z"),
      brandSnapshot: {},
      payloadSnapshot: dashboardFixture(),
    },
    {
      id: "expired",
      token: "expired",
      teamId: "team_1",
      propertyId: "property_1",
      createdAt: new Date("2026-03-24T10:00:00.000Z"),
      expiresAt: new Date("2026-03-25T10:00:00.000Z"),
      revokedAt: null,
      brandSnapshot: {},
      payloadSnapshot: dashboardFixture(),
    },
    {
      id: "valid",
      token: "valid",
      teamId: "team_1",
      propertyId: "property_1",
      createdAt: new Date("2026-03-23T10:00:00.000Z"),
      expiresAt: null,
      revokedAt: null,
      brandSnapshot: {},
      payloadSnapshot: dashboardFixture(),
    },
  ];

  const selected = selectPreviousPropertyShare(rows, new Date("2026-03-28T10:00:00.000Z"));
  assert.equal(selected?.shareId, "valid");
});

test("buildClientReportComparison returns baseline state without previous report", () => {
  const comparison = buildClientReportComparison({
    current: dashboardFixture(),
    previous: null,
  });

  assert.equal(comparison.previousCreatedAt, null);
  assert.equal(comparison.metricDeltas.clicks, null);
  assert.equal(comparison.pageMovements.length, 0);
  assert.equal(comparison.completedWork.length, 1);
});

test("buildClientReportComparison derives report-to-report movement and completed work", () => {
  const previous = dashboardFixture({
    overview: {
      ...dashboardFixture().overview,
      clicks: 70,
      impressions: 800,
      sessions: 50,
      users: 40,
    },
    evidence: {
      ...dashboardFixture().evidence,
      queryOpportunities: [
        { query: "brand", clicks: 12, impressions: 200, ctr: 0.06, position: 3 } as LiveDashboardData["evidence"]["queryOpportunities"][number],
      ],
      pageWinnersLosers: [
        {
          page: "/services",
          clicksCurrent: 10,
          clicksCompare: 8,
          clicksDelta: 2,
          impressionsCurrent: 100,
          impressionsCompare: 90,
          impressionsDelta: 10,
          status: "flat",
        } as unknown as LiveDashboardData["evidence"]["pageWinnersLosers"][number],
      ],
    },
    actions: [],
  });

  const comparison = buildClientReportComparison({
    current: dashboardFixture(),
    previous,
    previousCreatedAt: "2026-03-20T10:00:00.000Z",
  });

  assert.equal(comparison.metricDeltas.clicks, 30);
  assert.equal(comparison.metricDeltas.impressions, 200);
  assert.deepEqual(comparison.pageMovements[0], {
    label: "/services",
    current: 35,
    previous: 10,
    delta: 25,
  });
  assert.deepEqual(comparison.queryMovements[0], {
    label: "brand",
    current: 40,
    previous: 12,
    delta: 28,
  });
  assert.deepEqual(comparison.completedWork[0], {
    title: "Improve service page title",
    firstVisibleWin: "The service page is easier to understand in search results.",
    target: "/services",
  });
});

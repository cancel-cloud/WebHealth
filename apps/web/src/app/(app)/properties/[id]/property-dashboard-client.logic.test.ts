import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDashboardHref,
  buildSnapshotDownload,
  buildSparklinePath,
  filterDashboardActions,
  formatSourceDateCoverage,
  getActionCategoryModel,
  getPriorityModel,
  getSeverityValue,
  getSourceLabel,
} from "./property-dashboard-client.logic";

const baseAction = {
  fingerprint: "a",
  state: "open",
  rank: 1,
  recommendationClass: "technical",
  causeFamily: "technical_blocker",
};

test("buildDashboardHref keeps preset starts calculated and custom starts explicit", () => {
  assert.equal(
    buildDashboardHref({
      propertyId: "sc-domain:example.com",
      currentSearchParams: "foo=bar&start=2026-01-01",
      preset: "last_28d",
      compareMode: "previous_period",
      startDate: "2026-03-01",
      endDate: "2026-03-28",
    }),
    "/properties/sc-domain%3Aexample.com?foo=bar&preset=last_28d&compare=previous_period&end=2026-03-28",
  );

  assert.equal(
    buildDashboardHref({
      propertyId: "sc-domain:example.com",
      currentSearchParams: "",
      preset: "custom",
      compareMode: "none",
      startDate: "2026-03-01",
      endDate: "2026-03-28",
    }),
    "/properties/sc-domain%3Aexample.com?preset=custom&compare=none&end=2026-03-28&start=2026-03-01",
  );
});

test("buildDashboardHref can keep demo navigation on the public demo route", () => {
  assert.equal(
    buildDashboardHref({
      propertyId: "gsc_sc-domain:acmebakery.example",
      currentSearchParams: "demo=1&start=2026-01-01",
      preset: "last_90d",
      compareMode: "same_period_last_year",
      startDate: "2026-02-01",
      endDate: "2026-05-01",
      routeMode: "publicDemo",
    }),
    "/demo?demo=1&preset=last_90d&compare=same_period_last_year&end=2026-05-01",
  );
});

test("formatSourceDateCoverage handles null safe dates without invalid text", () => {
  assert.equal(formatSourceDateCoverage(null), "No safe date");
  assert.equal(formatSourceDateCoverage("2026-04-20"), "Apr 20, 2026");
});

test("getSourceLabel names crawl distinctly", () => {
  assert.equal(getSourceLabel("gsc"), "Search Console");
  assert.equal(getSourceLabel("ga4"), "GA4");
  assert.equal(getSourceLabel("crawl"), "Crawl");
});

test("buildSnapshotDownload returns metadata and a stable json filename", () => {
  const result = buildSnapshotDownload({
    dashboard: {
      property: { name: "Example Site", id: "sc-domain:example.com" },
      analysisWindow: {
        startDate: "2026-03-01",
        requestedEndDate: "2026-03-28",
      },
    },
    brandColors: { primary: "#111111", accent: "#222222" },
    language: "de",
  });

  assert.equal(result.filename, "webhealth-example-site-2026-03-01-2026-03-28.json");
  assert.equal(result.payload.metadata.exportType, "dashboard_snapshot_json");
  assert.equal(result.payload.metadata.language, "de");
  assert.equal(result.payload.brandColors.primary, "#111111");
});

test("filterDashboardActions supports workflow and source/category chips", () => {
  const actions = [
    baseAction,
    { ...baseAction, fingerprint: "b", state: "done", recommendationClass: "content", causeFamily: "content_decay" },
    { ...baseAction, fingerprint: "c", state: "in_progress", recommendationClass: "seo", causeFamily: "ctr_gap" },
    { ...baseAction, fingerprint: "d", source: "ai" as const, recommendationClass: "lift", causeFamily: "ai_review" },
  ];

  assert.deepEqual(filterDashboardActions(actions, "in_progress").map((action) => action.fingerprint), ["c"]);
  assert.deepEqual(filterDashboardActions(actions, "done").map((action) => action.fingerprint), ["b"]);
  assert.deepEqual(filterDashboardActions(actions, "crawl").map((action) => action.fingerprint), ["a"]);
  assert.deepEqual(filterDashboardActions(actions, "content").map((action) => action.fingerprint), ["b"]);
  assert.deepEqual(filterDashboardActions(actions, "ai").map((action) => action.fingerprint), ["d"]);
});

test("getPriorityModel maps ranks to compact priority badges", () => {
  assert.deepEqual(
    {
      label: getPriorityModel(1).label,
      tone: getPriorityModel(1).tone,
    },
    { label: "P1", tone: "critical" },
  );
  assert.equal(getPriorityModel(4).tone, "medium");
  assert.equal(getPriorityModel(null).label, "P4");
});

test("getActionCategoryModel derives reference-style source chips", () => {
  assert.equal(
    getActionCategoryModel({
      recommendationClass: "technical",
      causeFamily: "technical_blocker",
      actionFamily: "crawl_fix",
    }).label,
    "Crawl",
  );
  assert.equal(
    getActionCategoryModel({
      recommendationClass: "performance",
      causeFamily: "core_web_vitals",
      actionFamily: "lcp",
    }).label,
    "Perf",
  );
  assert.equal(
    getActionCategoryModel({
      recommendationClass: "content",
      causeFamily: "content_decay",
      actionFamily: "rewrite",
    }).label,
    "Content",
  );
});

test("getSeverityValue derives display severity from rank or system score", () => {
  assert.equal(getSeverityValue({ rank: 1, systemScore: null }), 5);
  assert.equal(getSeverityValue({ rank: 4, systemScore: null }), 3);
  assert.equal(getSeverityValue({ rank: 12, systemScore: 90 }), 5);
  assert.equal(getSeverityValue({ rank: null, systemScore: 10 }), 1);
});

test("buildSparklinePath only renders from real multi-point series", () => {
  assert.equal(buildSparklinePath([]), null);
  assert.equal(buildSparklinePath([42]), null);
  assert.equal(buildSparklinePath([10, 20, 15], 100, 30), "M 0 30 L 50 0 L 100 15");
});

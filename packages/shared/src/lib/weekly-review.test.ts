import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWeeklyReviewFindings,
  buildWeeklyReviewRunKey,
  getWeeklyReviewLimit,
  getWeeklyReviewWindow,
  shouldRunWeeklyScheduler,
} from "./weekly-review";

test("getWeeklyReviewLimit allows one watched property on free/solo and ten on pro", () => {
  assert.equal(getWeeklyReviewLimit("free"), 1);
  assert.equal(getWeeklyReviewLimit("solo"), 1);
  assert.equal(getWeeklyReviewLimit("pro"), 10);
});

test("getWeeklyReviewWindow selects the newest complete Mon-Sun period available", () => {
  assert.deepEqual(getWeeklyReviewWindow("2026-04-16"), {
    dateRangeStart: "2026-04-06",
    dateRangeEnd: "2026-04-12",
    compareRangeStart: "2026-03-30",
    compareRangeEnd: "2026-04-05",
  });
});

test("getWeeklyReviewWindow uses a Sunday latest date as a complete week end", () => {
  assert.equal(getWeeklyReviewWindow("2026-04-12").dateRangeEnd, "2026-04-12");
});

test("shouldRunWeeklyScheduler is true only on Sunday in the configured timezone", () => {
  assert.equal(
    shouldRunWeeklyScheduler(new Date("2026-04-19T10:00:00.000Z"), "Europe/Berlin"),
    true,
  );
  assert.equal(
    shouldRunWeeklyScheduler(new Date("2026-04-20T10:00:00.000Z"), "Europe/Berlin"),
    false,
  );
});

test("buildWeeklyReviewFindings flags changed pages with no impressions", () => {
  const findings = buildWeeklyReviewFindings({
    changedPages: [{ url: "https://example.com/new-guide" }],
    currentPages: [],
    comparePages: [],
  });

  assert.equal(findings[0]?.type, "no_impressions");
  assert.equal(findings[0]?.url, "https://example.com/new-guide");
  assert.equal(findings[0]?.actionable, true);
});

test("buildWeeklyReviewFindings flags impressions that rise without clicks following", () => {
  const findings = buildWeeklyReviewFindings({
    changedPages: [{ url: "https://example.com/pricing" }],
    currentPages: [{ page: "https://example.com/pricing", clicks: 2, impressions: 500 }],
    comparePages: [{ page: "https://example.com/pricing", clicks: 2, impressions: 100 }],
  });

  assert.equal(findings[0]?.type, "impressions_without_clicks");
});

test("buildWeeklyReviewFindings flags click or impression drops on changed pages", () => {
  const findings = buildWeeklyReviewFindings({
    changedPages: [{ url: "https://example.com/docs" }],
    currentPages: [{ page: "https://example.com/docs", clicks: 8, impressions: 80 }],
    comparePages: [{ page: "https://example.com/docs", clicks: 20, impressions: 120 }],
  });

  assert.equal(findings[0]?.type, "traffic_drop");
});

test("buildWeeklyReviewRunKey is stable for scheduler idempotency", () => {
  assert.equal(
    buildWeeklyReviewRunKey({
      teamId: "team_1",
      propertyId: "gsc_sc-domain:example.com",
      dateRangeStart: "2026-04-06",
      dateRangeEnd: "2026-04-12",
    }),
    "team_1:gsc_sc-domain:example.com:2026-04-06:2026-04-12",
  );
});

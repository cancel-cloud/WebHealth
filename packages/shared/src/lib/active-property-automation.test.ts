import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActivePropertyAutomationPlan,
  getDailyMetricsRefreshWindow,
  type ActiveAutomationProperty,
} from "./active-property-automation-policy";

function property(overrides: Partial<ActiveAutomationProperty> & Pick<ActiveAutomationProperty, "id" | "type">): ActiveAutomationProperty {
  return {
    id: overrides.id,
    teamId: overrides.teamId ?? "team_1",
    teamTier: overrides.teamTier ?? "starter",
    type: overrides.type,
    name: overrides.name ?? overrides.id,
    url: overrides.url ?? overrides.id,
    ga4PropertyId: overrides.ga4PropertyId ?? null,
    active: overrides.active ?? true,
    latestCrawlCreatedAt: overrides.latestCrawlCreatedAt ?? null,
    hasActiveAutomationRefresh: overrides.hasActiveAutomationRefresh ?? false,
    hasActiveManualRefresh: overrides.hasActiveManualRefresh ?? false,
    hasActiveMetricsJob: overrides.hasActiveMetricsJob ?? false,
  };
}

test("buildActivePropertyAutomationPlan includes only active linked website combinations", () => {
  const plan = buildActivePropertyAutomationPlan({
    now: new Date("2026-04-27T08:00:00.000Z"),
    properties: [
      property({ id: "gsc_sc-domain:active.example", type: "gsc", ga4PropertyId: "111" }),
      property({ id: "ga4_111", type: "ga4" }),
      property({ id: "gsc_sc-domain:inactive.example", type: "gsc", ga4PropertyId: "222", active: false }),
      property({ id: "ga4_222", type: "ga4", active: true }),
      property({ id: "gsc_sc-domain:gsc-only.example", type: "gsc", active: true }),
      property({ id: "ga4_333", type: "ga4", active: true }),
    ],
  });

  assert.deepEqual(plan.metricsRefreshes.map((item) => item.propertyId), ["gsc_sc-domain:active.example"]);
  assert.deepEqual(plan.crawlRefreshes.map((item) => item.propertyId), ["gsc_sc-domain:active.example"]);
});

test("buildActivePropertyAutomationPlan skips Solo free properties", () => {
  const plan = buildActivePropertyAutomationPlan({
    now: new Date("2026-04-27T08:00:00.000Z"),
    properties: [
      property({
        id: "gsc_sc-domain:solo.example",
        type: "gsc",
        ga4PropertyId: "111",
        teamTier: "free",
      }),
      property({ id: "ga4_111", type: "ga4", teamTier: "free" }),
      property({
        id: "gsc_sc-domain:paid.example",
        type: "gsc",
        ga4PropertyId: "222",
        teamTier: "starter",
      }),
      property({ id: "ga4_222", type: "ga4", teamTier: "starter" }),
    ],
  });

  assert.deepEqual(plan.metricsRefreshes.map((item) => item.propertyId), ["gsc_sc-domain:paid.example"]);
  assert.deepEqual(plan.crawlRefreshes.map((item) => item.propertyId), ["gsc_sc-domain:paid.example"]);
});

test("buildActivePropertyAutomationPlan skips fresh crawls and manual refreshes", () => {
  const plan = buildActivePropertyAutomationPlan({
    now: new Date("2026-04-27T08:00:00.000Z"),
    properties: [
      property({
        id: "gsc_sc-domain:fresh.example",
        type: "gsc",
        ga4PropertyId: "111",
        latestCrawlCreatedAt: "2026-04-26T10:00:00.000Z",
      }),
      property({ id: "ga4_111", type: "ga4" }),
      property({
        id: "gsc_sc-domain:manual.example",
        type: "gsc",
        ga4PropertyId: "222",
        latestCrawlCreatedAt: "2026-04-25T08:00:00.000Z",
        hasActiveManualRefresh: true,
      }),
      property({ id: "ga4_222", type: "ga4" }),
      property({
        id: "gsc_sc-domain:stale.example",
        type: "gsc",
        ga4PropertyId: "333",
        latestCrawlCreatedAt: "2026-04-25T08:00:00.000Z",
      }),
      property({ id: "ga4_333", type: "ga4" }),
    ],
  });

  assert.deepEqual(plan.crawlRefreshes.map((item) => item.propertyId), ["gsc_sc-domain:stale.example"]);
  assert.deepEqual(plan.metricsRefreshes.map((item) => item.propertyId), [
    "gsc_sc-domain:fresh.example",
    "gsc_sc-domain:manual.example",
    "gsc_sc-domain:stale.example",
  ]);
});

test("getDailyMetricsRefreshWindow refreshes a 14 day window ending yesterday", () => {
  assert.deepEqual(getDailyMetricsRefreshWindow(new Date("2026-04-27T05:00:00.000Z")), {
    dateStart: "2026-04-13",
    dateEnd: "2026-04-26",
  });
});

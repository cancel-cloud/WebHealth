import assert from "node:assert/strict";
import test from "node:test";
import { filterDashboardActions } from "../../../components/property-dashboard/property-dashboard-client.logic";
import {
  ACME_DEMO_DASHBOARD,
  ACME_DEMO_BRAND_COLORS,
  getAcmeDemoDashboard,
} from "./acme-demo-data";

function assertDemoShape(language: "en" | "de") {
  const dashboard = getAcmeDemoDashboard(language);

  assert.equal(dashboard.property.name, "Acme Bakery");
  assert.equal(dashboard.property.ga4PropertyId, "ga4_acme_bakery_demo");
  assert.equal(ACME_DEMO_BRAND_COLORS.primary, "#2563eb");
  assert.ok(dashboard.trend.length >= 14);
  assert.ok(dashboard.actions.length >= 5);
  assert.ok(filterDashboardActions(dashboard.actions, "ai").length >= 1);
  assert.ok(filterDashboardActions(dashboard.actions, "crawl").length >= 1);
  assert.ok(filterDashboardActions(dashboard.actions, "performance").length >= 1);
  assert.ok(filterDashboardActions(dashboard.actions, "seo").length >= 1);
  assert.ok(filterDashboardActions(dashboard.actions, "content").length >= 1);
  assert.ok(dashboard.evidence.queryOpportunities.length >= 5);
  assert.ok(dashboard.evidence.pageWinnersLosers.length >= 5);
  assert.ok(dashboard.evidence.nearWins.length >= 3);
  assert.ok(dashboard.recentSnapshots.length >= 2);
  assert.deepEqual(
    dashboard.freshness.sources.map((source) => source.source).sort(),
    ["crawl", "ga4", "gsc"],
  );
}

test("Acme demo dashboard fixture has enough public product proof data", () => {
  assertDemoShape("en");
  assert.deepEqual(ACME_DEMO_DASHBOARD, getAcmeDemoDashboard("en"));
});

test("localized Acme demo keeps the same shape with German visible copy", () => {
  const dashboard = getAcmeDemoDashboard("de");

  assertDemoShape("de");
  assert.match(dashboard.actions[0]?.title ?? "", /Custom-Cake-Seite/);
  assert.match(dashboard.operatingContext.summary, /Acme gewinnt/);
  assert.match(dashboard.freshness.sources[0]?.note ?? "", /Search Console bis/);
  assert.doesNotMatch(dashboard.actions[0]?.title ?? "", /Recover the custom cake page/);
});

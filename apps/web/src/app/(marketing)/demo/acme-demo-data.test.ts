import assert from "node:assert/strict";
import test from "node:test";
import { ACME_DEMO_DASHBOARD, ACME_DEMO_BRAND_COLORS } from "./acme-demo-data";

test("Acme demo dashboard fixture has enough public product proof data", () => {
  assert.equal(ACME_DEMO_DASHBOARD.property.name, "Acme Bakery");
  assert.equal(ACME_DEMO_DASHBOARD.property.ga4PropertyId, "ga4_acme_bakery_demo");
  assert.equal(ACME_DEMO_BRAND_COLORS.primary, "#2563eb");
  assert.ok(ACME_DEMO_DASHBOARD.trend.length >= 14);
  assert.ok(ACME_DEMO_DASHBOARD.actions.length >= 5);
  assert.ok(ACME_DEMO_DASHBOARD.evidence.queryOpportunities.length >= 5);
  assert.ok(ACME_DEMO_DASHBOARD.evidence.pageWinnersLosers.length >= 5);
  assert.ok(ACME_DEMO_DASHBOARD.evidence.nearWins.length >= 3);
  assert.ok(ACME_DEMO_DASHBOARD.recentSnapshots.length >= 2);
  assert.deepEqual(
    ACME_DEMO_DASHBOARD.freshness.sources.map((source) => source.source).sort(),
    ["crawl", "ga4", "gsc"],
  );
});

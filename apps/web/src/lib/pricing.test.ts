import assert from "node:assert/strict";
import test from "node:test";

import {
  formatEuroDisplay,
  PRICING_PLANS,
} from "./pricing";

test("pricing plans expose the current euro prices and snapshot features", () => {
  assert.equal(PRICING_PLANS.solo.priceLabel, "0€");
  assert.equal(PRICING_PLANS.starter.priceLabel, "29€");
  assert.equal(PRICING_PLANS.studio.priceLabel, "79€");
  assert.ok(PRICING_PLANS.solo.features.includes("Snapshot exports"));
  assert.ok(PRICING_PLANS.studio.features.includes("Priority refreshes"));
});

test("formatEuroDisplay appends euro without conversion", () => {
  assert.equal(formatEuroDisplay("19"), "19€");
  assert.equal(formatEuroDisplay(38), "38€");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  formatEuroDisplay,
  PRICING_PLANS,
} from "./pricing";

test("pricing plans expose the current euro prices and pro limits", () => {
  assert.equal(PRICING_PLANS.solo.priceLabel, "0€");
  assert.equal(PRICING_PLANS.pro.priceLabel, "38€");
  assert.equal(PRICING_PLANS.pro.reportsPerMonth, 50);
  assert.equal(PRICING_PLANS.pro.deepDivesPerMonth, 200);
});

test("formatEuroDisplay appends euro without conversion", () => {
  assert.equal(formatEuroDisplay("19"), "19€");
  assert.equal(formatEuroDisplay(38), "38€");
});

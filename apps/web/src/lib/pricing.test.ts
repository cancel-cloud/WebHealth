import assert from "node:assert/strict";
import test from "node:test";

import {
  FOUNDING_AGENCY_PILOT_LIMIT,
  FOUNDING_AGENCY_PILOT_PRICE_EUR,
  formatEuroDisplay,
  PILOT_BOOKING_URL,
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

test("founding agency pilot exposes the public offer constants", () => {
  assert.equal(
    PILOT_BOOKING_URL,
    "https://cal.com/lukas-devbrew/webhealth-pilot-check",
  );
  assert.equal(FOUNDING_AGENCY_PILOT_PRICE_EUR, 149);
  assert.equal(FOUNDING_AGENCY_PILOT_LIMIT, 10);
});

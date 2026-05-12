import assert from "node:assert/strict";
import test from "node:test";

import {
  FOUNDING_AGENCY_PILOT_LIMIT,
  FOUNDING_AGENCY_PILOT_PRICE_EUR,
  formatEuroDisplay,
  getAgencyPrice,
  PILOT_BOOKING_URL,
  PRICING_PLANS,
  PUBLIC_PRICING_PLANS,
} from "./pricing";

test("pricing plans expose the current euro prices and snapshot features", () => {
  assert.equal(PRICING_PLANS.solo.priceLabel, "0€");
  assert.equal(PRICING_PLANS.starter.priceLabel, "29€");
  assert.equal(PRICING_PLANS.studio.priceLabel, "79€");
  assert.ok(PRICING_PLANS.solo.features.includes("Snapshot exports"));
  assert.ok(PRICING_PLANS.studio.features.includes("Priority refreshes"));
});

test("public solo pricing avoids negative feature and support framing", () => {
  const soloPlan = PUBLIC_PRICING_PLANS.find((plan) => plan.tier === "solo");
  const englishFeatures = soloPlan?.features.map((feature) => feature.en) ?? [];

  assert.ok(englishFeatures.includes("Email support"));
  assert.doesNotMatch(englishFeatures.join("\n"), /White-label off|Community support/);
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

test("agency pricing includes 25 sites and 6 euro site overage", () => {
  const agencyPlan = PUBLIC_PRICING_PLANS.find((plan) => plan.tier === "agency");

  assert.equal(agencyPlan?.note?.en, "Up to 25 sites included, then +€6/site");
  assert.equal(getAgencyPrice(25), 149);
  assert.equal(getAgencyPrice(26), 155);
});

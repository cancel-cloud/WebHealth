import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_PLAN_SETTINGS,
  isPublishedPlanTier,
  sortPublishedPlanSettings,
} from "./plan-settings-defaults";

test("default plan settings match published pricing tiers", () => {
  const byTier = new Map(DEFAULT_PLAN_SETTINGS.map((setting) => [setting.tier, setting]));

  assert.equal(byTier.get("free")?.displayName, "Solo");
  assert.equal(byTier.get("free")?.maxProperties, 1);
  assert.equal(byTier.get("starter")?.maxProperties, 5);
  assert.equal(byTier.get("studio")?.maxProperties, 20);
  assert.equal(byTier.get("agency")?.maxProperties, 25);
});

test("published tier helpers filter legacy plans and preserve landing-page order", () => {
  const settings = [
    { tier: "agency", displayName: "Agency" },
    { tier: "enterprise", displayName: "Enterprise" },
    { tier: "free", displayName: "Solo" },
    { tier: "studio", displayName: "Studio" },
    { tier: "starter", displayName: "Starter" },
  ];

  const publishedSettings = settings.filter((setting) => isPublishedPlanTier(setting.tier));

  assert.deepEqual(
    sortPublishedPlanSettings(publishedSettings).map((setting) => setting.displayName),
    ["Solo", "Starter", "Studio", "Agency"],
  );
});

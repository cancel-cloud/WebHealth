import assert from "node:assert/strict";
import test from "node:test";

import { buildPropertyActiveUpdate } from "./[id]/active/route.logic";

test("buildPropertyActiveUpdate disables weekly review when deactivating a watched property", () => {
  const result = buildPropertyActiveUpdate({
    enabled: false,
    weeklyReviewEnabled: true,
    activePropertiesBefore: 3,
  });

  assert.equal(result.nextActive, false);
  assert.equal(result.shouldDisableWeeklyReview, true);
  assert.equal(result.activePropertiesAfter, 2);
});

test("buildPropertyActiveUpdate increments active count when activating an inactive property", () => {
  const result = buildPropertyActiveUpdate({
    enabled: true,
    weeklyReviewEnabled: false,
    activePropertiesBefore: 3,
    propertyWasActive: false,
  });

  assert.equal(result.nextActive, true);
  assert.equal(result.shouldDisableWeeklyReview, false);
  assert.equal(result.activePropertiesAfter, 4);
});

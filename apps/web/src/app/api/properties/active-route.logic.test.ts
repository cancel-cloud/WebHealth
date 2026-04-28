import assert from "node:assert/strict";
import test from "node:test";

import { buildPropertyActiveUpdate } from "./[id]/active/route.logic";

test("buildPropertyActiveUpdate decrements active count when deactivating an active property", () => {
  const result = buildPropertyActiveUpdate({
    enabled: false,
    activePropertiesBefore: 3,
  });

  assert.equal(result.nextActive, false);
  assert.equal(result.activePropertiesAfter, 2);
});

test("buildPropertyActiveUpdate increments active count when activating an inactive property", () => {
  const result = buildPropertyActiveUpdate({
    enabled: true,
    activePropertiesBefore: 3,
    propertyWasActive: false,
  });

  assert.equal(result.nextActive, true);
  assert.equal(result.activePropertiesAfter, 4);
});

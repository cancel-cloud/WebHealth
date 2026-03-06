import assert from "node:assert/strict";
import test from "node:test";

import { shouldAllowScheduledStart } from "./route.logic";

test("scheduled reports can start when ga4 is linked", () => {
  assert.equal(shouldAllowScheduledStart({ hasLinkedGa4: true, forceWithoutGa4: false }), true);
});

test("scheduled reports can start when user chooses continue anyway", () => {
  assert.equal(shouldAllowScheduledStart({ hasLinkedGa4: false, forceWithoutGa4: true }), true);
});

test("scheduled reports stay blocked when ga4 is missing and continue anyway was not requested", () => {
  assert.equal(shouldAllowScheduledStart({ hasLinkedGa4: false, forceWithoutGa4: false }), false);
});

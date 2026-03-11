import assert from "node:assert/strict";
import test from "node:test";

import { SIDEBAR_MENU_SKELETON_WIDTH } from "./sidebar.logic";

test("sidebar menu skeleton width is deterministic", () => {
  assert.equal(SIDEBAR_MENU_SKELETON_WIDTH, "72%");
});

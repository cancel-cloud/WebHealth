import assert from "node:assert/strict";
import test from "node:test";

import { formatPlanName, getPlanStatusLabel } from "./plan-label";

test("formatPlanName maps free-tier plan names to Solo Plan", () => {
  assert.equal(formatPlanName("free"), "Solo Plan");
  assert.equal(formatPlanName("starter"), "Starter Plan");
  assert.equal(formatPlanName("studio"), "Studio Plan");
  assert.equal(formatPlanName("agency"), "Agency Plan");
  assert.equal(formatPlanName(undefined), "Solo Plan");
});

test("getPlanStatusLabel omits the current-plan label unless canceling", () => {
  assert.equal(getPlanStatusLabel(null), null);
  assert.equal(getPlanStatusLabel(undefined), null);
  assert.equal(getPlanStatusLabel("2026-04-15T00:00:00.000Z"), "Canceling");
});

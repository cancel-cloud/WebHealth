import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDeactivationPlan,
  isDowngrade,
  type CullingPropertyRow,
} from "./tier-change-cleanup-policy";

function prop(overrides: Partial<CullingPropertyRow> & Pick<CullingPropertyRow, "id">): CullingPropertyRow {
  return {
    id: overrides.id,
    type: overrides.type ?? "gsc",
    ga4PropertyId: overrides.ga4PropertyId ?? null,
    active: overrides.active ?? true,
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
  };
}

test("isDowngrade: both numbers, new < old", () => {
  assert.equal(isDowngrade(20, 5), true);
});

test("isDowngrade: both numbers, new === old", () => {
  assert.equal(isDowngrade(5, 5), false);
});

test("isDowngrade: both numbers, new > old", () => {
  assert.equal(isDowngrade(5, 20), false);
});

test("isDowngrade: old unlimited, new capped", () => {
  assert.equal(isDowngrade(null, 5), true);
});

test("isDowngrade: new unlimited", () => {
  assert.equal(isDowngrade(5, null), false);
});

test("isDowngrade: both unlimited", () => {
  assert.equal(isDowngrade(null, null), false);
});

test("buildDeactivationPlan: no-op when within limit", () => {
  const plan = buildDeactivationPlan({
    maxAllowed: 2,
    properties: [
      prop({ id: "gsc_1", type: "gsc", ga4PropertyId: "111" }),
      prop({ id: "ga4_111", type: "ga4" }),
      prop({ id: "gsc_2", type: "gsc", ga4PropertyId: "222" }),
      prop({ id: "ga4_222", type: "ga4" }),
    ],
  });

  assert.equal(plan.deactivatedGroupCount, 0);
  assert.deepEqual(plan.deactivatedPropertyIds, []);
});

test("buildDeactivationPlan: culls excess groups", () => {
  const plan = buildDeactivationPlan({
    maxAllowed: 1,
    properties: [
      prop({ id: "gsc_1", type: "gsc", ga4PropertyId: "111" }),
      prop({ id: "ga4_111", type: "ga4" }),
      prop({ id: "gsc_2", type: "gsc", ga4PropertyId: "222" }),
      prop({ id: "ga4_222", type: "ga4" }),
    ],
  });

  assert.equal(plan.deactivatedGroupCount, 1);
  assert.equal(plan.deactivatedPropertyIds.length, 2);
});

test("buildDeactivationPlan: culls most recently added first", () => {
  const older = new Date("2026-01-01T00:00:00.000Z");
  const newer = new Date("2026-03-15T00:00:00.000Z");

  const plan = buildDeactivationPlan({
    maxAllowed: 1,
    properties: [
      prop({ id: "gsc_older", type: "gsc", ga4PropertyId: "111", createdAt: older }),
      prop({ id: "ga4_111", type: "ga4", createdAt: older }),
      prop({ id: "gsc_newer", type: "gsc", ga4PropertyId: "222", createdAt: newer }),
      prop({ id: "ga4_222", type: "ga4", createdAt: newer }),
    ],
  });

  assert.equal(plan.deactivatedGroupCount, 1);
  assert.equal(plan.deactivatedPropertyIds.includes("ga4_222"), true);
  assert.equal(plan.deactivatedPropertyIds.includes("gsc_newer"), true);
  assert.equal(plan.deactivatedPropertyIds.includes("ga4_111"), false);
});

test("buildDeactivationPlan: uses greatest timestamp in group for ordering", () => {
  const ga4Older = new Date("2026-01-01T00:00:00.000Z");
  const gscNewer = new Date("2026-06-01T00:00:00.000Z");
  const ga4Newer = new Date("2026-05-01T00:00:00.000Z");
  const gscOlder = new Date("2026-02-01T00:00:00.000Z");

  const plan = buildDeactivationPlan({
    maxAllowed: 1,
    properties: [
      prop({ id: "gsc_a", type: "gsc", ga4PropertyId: "111", createdAt: gscNewer }),
      prop({ id: "ga4_111", type: "ga4", createdAt: ga4Older }),
      prop({ id: "gsc_b", type: "gsc", ga4PropertyId: "222", createdAt: gscOlder }),
      prop({ id: "ga4_222", type: "ga4", createdAt: ga4Newer }),
    ],
  });

  assert.equal(plan.deactivatedGroupCount, 1);
  assert.equal(plan.deactivatedPropertyIds.includes("gsc_a"), true);
  assert.equal(plan.deactivatedPropertyIds.includes("ga4_111"), true);
});

test("buildDeactivationPlan: GA4 ID tiebreaker when timestamps equal", () => {
  const sameTime = new Date("2026-01-01T00:00:00.000Z");

  const plan = buildDeactivationPlan({
    maxAllowed: 1,
    properties: [
      prop({ id: "gsc_1", type: "gsc", ga4PropertyId: "111", createdAt: sameTime }),
      prop({ id: "ga4_111", type: "ga4", createdAt: sameTime }),
      prop({ id: "gsc_2", type: "gsc", ga4PropertyId: "222", createdAt: sameTime }),
      prop({ id: "ga4_222", type: "ga4", createdAt: sameTime }),
    ],
  });

  assert.equal(plan.deactivatedGroupCount, 1);
  assert.equal(plan.deactivatedPropertyIds.includes("ga4_222"), true);
  assert.equal(plan.deactivatedPropertyIds.includes("gsc_2"), true);
});

test("buildDeactivationPlan: deactivates both GA4 and all linked GSC rows for excess group", () => {
  const plan = buildDeactivationPlan({
    maxAllowed: 1,
    properties: [
      prop({ id: "gsc_a", type: "gsc", ga4PropertyId: "111" }),
      prop({ id: "gsc_b", type: "gsc", ga4PropertyId: "111" }),
      prop({ id: "ga4_111", type: "ga4" }),
      prop({ id: "gsc_c", type: "gsc", ga4PropertyId: "222" }),
      prop({ id: "ga4_222", type: "ga4" }),
    ],
  });

  assert.equal(plan.deactivatedGroupCount, 1);

  const culledGa4 = plan.deactivatedPropertyIds.find((id) => id.startsWith("ga4_"));
  assert.ok(culledGa4, "should deactivate a GA4 row");

  const culledGscIds = plan.deactivatedPropertyIds.filter((id) => id.startsWith("gsc_"));
  assert.ok(culledGscIds.length >= 1, "should deactivate at least one GSC row");
});

test("buildDeactivationPlan: skips inactive GA4", () => {
  const plan = buildDeactivationPlan({
    maxAllowed: 1,
    properties: [
      prop({ id: "gsc_1", type: "gsc", ga4PropertyId: "111" }),
      prop({ id: "ga4_111", type: "ga4" }),
      prop({ id: "gsc_2", type: "gsc", ga4PropertyId: "222" }),
      prop({ id: "ga4_222", type: "ga4", active: false }),
    ],
  });

  assert.equal(plan.deactivatedGroupCount, 0);
});

test("buildDeactivationPlan: skips GSC without ga4PropertyId", () => {
  const plan = buildDeactivationPlan({
    maxAllowed: 1,
    properties: [
      prop({ id: "gsc_1", type: "gsc", ga4PropertyId: "111" }),
      prop({ id: "ga4_111", type: "ga4" }),
      prop({ id: "gsc_orphan", type: "gsc", ga4PropertyId: null }),
    ],
  });

  assert.equal(plan.deactivatedGroupCount, 0);
});

test("buildDeactivationPlan: counts distinct GA4 groups, not raw GSC rows", () => {
  const plan = buildDeactivationPlan({
    maxAllowed: 1,
    properties: [
      prop({ id: "gsc_a", type: "gsc", ga4PropertyId: "922", createdAt: new Date("2026-01-01") }),
      prop({ id: "gsc_b", type: "gsc", ga4PropertyId: "922", createdAt: new Date("2026-01-02") }),
      prop({ id: "ga4_922", type: "ga4", createdAt: new Date("2026-01-01") }),
      prop({ id: "gsc_c", type: "gsc", ga4PropertyId: "333", createdAt: new Date("2026-01-03") }),
      prop({ id: "ga4_333", type: "ga4", createdAt: new Date("2026-01-03") }),
    ],
  });

  assert.equal(plan.deactivatedGroupCount, 1);
  assert.equal(plan.deactivatedPropertyIds.includes("ga4_333"), true);
  assert.equal(plan.deactivatedPropertyIds.includes("gsc_c"), true);
  assert.equal(plan.deactivatedPropertyIds.includes("gsc_a"), false);
  assert.equal(plan.deactivatedPropertyIds.includes("gsc_b"), false);
  assert.equal(plan.deactivatedPropertyIds.includes("ga4_922"), false);
});
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPropertyActiveGroupPlan,
  buildPropertyActiveUpdate,
  type ActiveRouteProperty,
} from "./[id]/active/route.logic";

function property(overrides: Partial<ActiveRouteProperty> & Pick<ActiveRouteProperty, "id" | "type">): ActiveRouteProperty {
  return {
    id: overrides.id,
    type: overrides.type,
    active: overrides.active ?? false,
    ga4PropertyId: overrides.ga4PropertyId ?? null,
  };
}

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

test("buildPropertyActiveGroupPlan activates a complete linked property group", () => {
  const allTeamProperties = [
    property({ id: "gsc_sc-domain:example.com", type: "gsc", ga4PropertyId: "123" }),
    property({ id: "ga4_123", type: "ga4" }),
  ];

  const plan = buildPropertyActiveGroupPlan({
    enabled: true,
    propertyId: "gsc_sc-domain:example.com",
    requestedProperties: allTeamProperties,
    allTeamProperties,
    maxActiveProperties: 5,
  });

  assert.deepEqual(plan.activateIds, ["gsc_sc-domain:example.com", "ga4_123"]);
  assert.deepEqual(plan.deactivateIds, []);
  assert.equal(plan.activePropertiesAfter, 1);
});

test("buildPropertyActiveGroupPlan rejects GSC-only and GA4-only activation", () => {
  assert.throws(
    () => buildPropertyActiveGroupPlan({
      enabled: true,
      propertyId: "gsc_sc-domain:example.com",
      requestedProperties: [
        property({ id: "gsc_sc-domain:example.com", type: "gsc" }),
      ],
      allTeamProperties: [
        property({ id: "gsc_sc-domain:example.com", type: "gsc" }),
      ],
      maxActiveProperties: 5,
    }),
    /requires a linked GA4/,
  );

  assert.throws(
    () => buildPropertyActiveGroupPlan({
      enabled: true,
      propertyId: "ga4_123",
      requestedProperties: [
        property({ id: "ga4_123", type: "ga4" }),
      ],
      allTeamProperties: [
        property({ id: "ga4_123", type: "ga4" }),
      ],
      maxActiveProperties: 5,
    }),
    /Only linked Search Console/,
  );
});

test("buildPropertyActiveGroupPlan rejects a second active linked property for Solo", () => {
  const allTeamProperties = [
    property({ id: "gsc_sc-domain:active.example", type: "gsc", ga4PropertyId: "111", active: true }),
    property({ id: "ga4_111", type: "ga4", active: true }),
    property({ id: "gsc_sc-domain:next.example", type: "gsc", ga4PropertyId: "222" }),
    property({ id: "ga4_222", type: "ga4" }),
  ];

  assert.throws(
    () => buildPropertyActiveGroupPlan({
      enabled: true,
      propertyId: "gsc_sc-domain:next.example",
      requestedProperties: [allTeamProperties[2], allTeamProperties[3]],
      allTeamProperties,
      maxActiveProperties: 1,
    }),
    /This plan can activate 1 linked property/,
  );
});

test("buildPropertyActiveGroupPlan deactivates duplicate GSC rows linked to the same GA4 when activating canonical row", () => {
  const allTeamProperties = [
    property({ id: "gsc_sc-domain:devbrew.dev", type: "gsc", ga4PropertyId: "123" }),
    property({ id: "ga4_123", type: "ga4" }),
    property({ id: "gsc_https://www.devbrew.dev/", type: "gsc", ga4PropertyId: "123", active: true }),
  ];

  const plan = buildPropertyActiveGroupPlan({
    enabled: true,
    propertyId: "gsc_sc-domain:devbrew.dev",
    requestedProperties: [allTeamProperties[0], allTeamProperties[1], allTeamProperties[2]],
    allTeamProperties,
    maxActiveProperties: 5,
  });

  assert.deepEqual(plan.activateIds, ["gsc_sc-domain:devbrew.dev", "ga4_123"]);
  assert.deepEqual(plan.deactivateIds, ["gsc_https://www.devbrew.dev/"]);
  assert.equal(plan.activePropertiesAfter, 1);
});

test("buildPropertyActiveGroupPlan keeps other paid active linked properties active", () => {
  const allTeamProperties = [
    property({ id: "gsc_sc-domain:active.example", type: "gsc", ga4PropertyId: "111", active: true }),
    property({ id: "ga4_111", type: "ga4", active: true }),
    property({ id: "gsc_sc-domain:next.example", type: "gsc", ga4PropertyId: "222" }),
    property({ id: "ga4_222", type: "ga4" }),
  ];

  const plan = buildPropertyActiveGroupPlan({
    enabled: true,
    propertyId: "gsc_sc-domain:next.example",
    requestedProperties: [allTeamProperties[2], allTeamProperties[3]],
    allTeamProperties,
    maxActiveProperties: 5,
  });

  assert.deepEqual(plan.activateIds, ["gsc_sc-domain:next.example", "ga4_222"]);
  assert.deepEqual(plan.deactivateIds, []);
  assert.equal(plan.activePropertiesAfter, 2);
});

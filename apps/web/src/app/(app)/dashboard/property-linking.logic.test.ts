import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOnboardingLinkRows,
  getGa4PropertyOptions,
  type LinkableGoogleProperty,
} from "./property-linking.logic";

function property(overrides: Partial<LinkableGoogleProperty> & Pick<LinkableGoogleProperty, "id" | "type">): LinkableGoogleProperty {
  return {
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    url: overrides.url ?? overrides.id,
    type: overrides.type,
    ga4PropertyId: overrides.ga4PropertyId ?? null,
  };
}

test("getGa4PropertyOptions exposes sorted numeric GA4 ids", () => {
  assert.deepEqual(
    getGa4PropertyOptions([
      property({ id: "ga4_222", type: "ga4", name: "Zed" }),
      property({ id: "ga4_111", type: "ga4", name: "Alpha" }),
      property({ id: "gsc_sc-domain:alpha.test", type: "gsc" }),
    ]),
    [
      { id: "ga4_111", numericId: "111", name: "Alpha" },
      { id: "ga4_222", numericId: "222", name: "Zed" },
    ],
  );
});

test("buildOnboardingLinkRows preselects editable suggested GA4 matches without persisting them", () => {
  const rows = buildOnboardingLinkRows([
    property({
      id: "gsc_sc-domain:example.com",
      type: "gsc",
      name: "example.com",
      url: "sc-domain:example.com",
    }),
    property({
      id: "ga4_123",
      type: "ga4",
      name: "example.com",
    }),
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].linkedGa4PropertyId, null);
  assert.equal(rows[0].suggestedGa4PropertyId, "123");
  assert.equal(rows[0].selectedGa4PropertyId, "123");
});

test("buildOnboardingLinkRows prefers existing links over suggestions", () => {
  const [row] = buildOnboardingLinkRows([
    property({
      id: "gsc_sc-domain:example.com",
      type: "gsc",
      url: "sc-domain:example.com",
      ga4PropertyId: "999",
    }),
    property({ id: "ga4_123", type: "ga4", name: "example.com" }),
    property({ id: "ga4_999", type: "ga4", name: "Other GA4" }),
  ]);

  assert.equal(row.linkedGa4PropertyId, "999");
  assert.equal(row.suggestedGa4PropertyId, "999");
  assert.equal(row.selectedGa4PropertyId, "999");
});

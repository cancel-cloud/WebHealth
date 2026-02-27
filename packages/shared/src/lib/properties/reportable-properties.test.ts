import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCombinedReportableProperties,
  resolveReportSourcesFromProperties,
  type PropertyRecordLike,
} from "./reportable-properties";

function makeProperty(overrides: Partial<PropertyRecordLike> & Pick<PropertyRecordLike, "id" | "teamId" | "type">): PropertyRecordLike {
  return {
    id: overrides.id,
    teamId: overrides.teamId,
    type: overrides.type,
    name: overrides.name ?? overrides.id,
    url: overrides.url ?? overrides.id,
    ga4PropertyId: overrides.ga4PropertyId ?? null,
  };
}

test("buildCombinedReportableProperties collapses linked GSC/GA4 rows to one entry labeled by GA4 name", () => {
  const rows: PropertyRecordLike[] = [
    makeProperty({
      id: "gsc_sc-domain:sfk-seilzuege.de",
      teamId: "team_1",
      type: "gsc",
      name: "sfk-seilzuege.de",
      url: "sc-domain:sfk-seilzuege.de",
      ga4PropertyId: "513605441",
    }),
    makeProperty({
      id: "gsc_https://www.sfk-seilzuege.de/",
      teamId: "team_1",
      type: "gsc",
      name: "www.sfk-seilzuege.de",
      url: "https://www.sfk-seilzuege.de/",
      ga4PropertyId: "513605441",
    }),
    makeProperty({
      id: "ga4_513605441",
      teamId: "team_1",
      type: "ga4",
      name: "SFK Website",
      url: "SFK Website",
    }),
  ];

  const combined = buildCombinedReportableProperties(rows);

  assert.equal(combined.length, 1);
  assert.equal(combined[0].id, "gsc_sc-domain:sfk-seilzuege.de");
  assert.equal(combined[0].label, "SFK Website");
  assert.equal(combined[0].ga4DbId, "ga4_513605441");
  assert.equal(combined[0].gscUrl, "sc-domain:sfk-seilzuege.de");
});

test("resolveReportSourcesFromProperties maps a selected GA4 property to its linked canonical GSC property", () => {
  const rows: PropertyRecordLike[] = [
    makeProperty({
      id: "ga4_513605441",
      teamId: "team_1",
      type: "ga4",
      name: "SFK Website",
      url: "SFK Website",
    }),
    makeProperty({
      id: "gsc_sc-domain:sfk-seilzuege.de",
      teamId: "team_1",
      type: "gsc",
      name: "sfk-seilzuege.de",
      url: "sc-domain:sfk-seilzuege.de",
      ga4PropertyId: "513605441",
    }),
  ];

  const resolved = resolveReportSourcesFromProperties(rows, "ga4_513605441");

  assert.equal(resolved.selectedWasGa4, true);
  assert.equal(resolved.canonicalReportPropertyId, "gsc_sc-domain:sfk-seilzuege.de");
  assert.equal(resolved.canonicalGscProperty.url, "sc-domain:sfk-seilzuege.de");
  assert.equal(resolved.linkedGa4Property?.name, "SFK Website");
});

test("resolveReportSourcesFromProperties throws when GA4 property has no linked GSC property", () => {
  const rows: PropertyRecordLike[] = [
    makeProperty({
      id: "ga4_123",
      teamId: "team_1",
      type: "ga4",
      name: "Unlinked GA4",
      url: "Unlinked GA4",
    }),
  ];

  assert.throws(
    () => resolveReportSourcesFromProperties(rows, "ga4_123"),
    /not linked to a Google Search Console property/,
  );
});

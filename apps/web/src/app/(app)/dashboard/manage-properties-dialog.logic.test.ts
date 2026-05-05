import assert from "node:assert/strict";
import test from "node:test";

import {
  buildManagedPropertyRows,
  filterManagedPropertyRows,
  getManagedPropertyToggleTargets,
  type ManagedPropertySource,
} from "./manage-properties-dialog.logic";

function source(overrides: Partial<ManagedPropertySource> & Pick<ManagedPropertySource, "id" | "type">): ManagedPropertySource {
  return {
    id: overrides.id,
    teamId: overrides.teamId ?? "team_1",
    name: overrides.name ?? overrides.id,
    url: overrides.url ?? overrides.id,
    type: overrides.type,
    active: overrides.active ?? true,
    ga4PropertyId: overrides.ga4PropertyId ?? null,
  };
}

test("buildManagedPropertyRows collapses linked GSC and GA4 sources into one GA4-labeled row", () => {
  const rows = buildManagedPropertyRows([
    source({
      id: "gsc_sc-domain:sfk-seilzuege.de",
      type: "gsc",
      name: "sfk-seilzuege.de",
      url: "sc-domain:sfk-seilzuege.de",
      ga4PropertyId: "513605441",
    }),
    source({
      id: "ga4_513605441",
      type: "ga4",
      name: "SFK Website",
      url: "SFK Website",
    }),
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "linked:gsc_sc-domain:sfk-seilzuege.de:ga4_513605441");
  assert.equal(rows[0].name, "SFK Website");
  assert.equal(rows[0].sourceLabel, "GA4");
  assert.equal(rows[0].linked, true);
});

test("buildManagedPropertyRows collapses multiple linked GSC rows by GA4 and prefers canonical domain GSC", () => {
  const rows = buildManagedPropertyRows([
    source({
      id: "gsc_https://www.devbrew.dev/",
      type: "gsc",
      name: "www.devbrew.dev",
      url: "https://www.devbrew.dev/",
      ga4PropertyId: "513605441",
      active: true,
    }),
    source({
      id: "gsc_sc-domain:devbrew.dev",
      type: "gsc",
      name: "devbrew.dev",
      url: "sc-domain:devbrew.dev",
      ga4PropertyId: "513605441",
      active: false,
    }),
    source({
      id: "ga4_513605441",
      type: "ga4",
      name: "DevBrew Website",
      url: "DevBrew Website",
      active: true,
    }),
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, "linked:gsc_sc-domain:devbrew.dev:ga4_513605441");
  assert.equal(rows[0].url, "sc-domain:devbrew.dev");
  assert.equal(rows[0].active, true);
  assert.deepEqual(rows[0].sourceIds, [
    "gsc_sc-domain:devbrew.dev",
    "ga4_513605441",
    "gsc_https://www.devbrew.dev/",
  ]);
});

test("filterManagedPropertyRows searches labels, domains, urls, and source ids", () => {
  const rows = buildManagedPropertyRows([
    source({
      id: "gsc_sc-domain:sfk-seilzuege.de",
      type: "gsc",
      name: "sfk-seilzuege.de",
      url: "sc-domain:sfk-seilzuege.de",
      ga4PropertyId: "513605441",
    }),
    source({
      id: "ga4_513605441",
      type: "ga4",
      name: "SFK Website",
      url: "SFK Website",
    }),
    source({ id: "gsc_https://lukas.devbrew.dev/", type: "gsc", name: "lukas.devbrew.dev", url: "https://lukas.devbrew.dev/" }),
  ]);

  assert.deepEqual(filterManagedPropertyRows(rows, "sfk").map((row) => row.name), ["SFK Website"]);
  assert.deepEqual(filterManagedPropertyRows(rows, "513605441").map((row) => row.name), ["SFK Website"]);
  assert.deepEqual(filterManagedPropertyRows(rows, "lukas").map((row) => row.name), ["lukas.devbrew.dev"]);
});

test("filterManagedPropertyRows searches duplicate linked GSC urls hidden behind one GA4 row", () => {
  const rows = buildManagedPropertyRows([
    source({
      id: "gsc_sc-domain:devbrew.dev",
      type: "gsc",
      name: "devbrew.dev",
      url: "sc-domain:devbrew.dev",
      ga4PropertyId: "513605441",
    }),
    source({
      id: "gsc_https://www.devbrew.dev/",
      type: "gsc",
      name: "www.devbrew.dev",
      url: "https://www.devbrew.dev/",
      ga4PropertyId: "513605441",
    }),
    source({
      id: "ga4_513605441",
      type: "ga4",
      name: "DevBrew Website",
      url: "DevBrew Website",
    }),
  ]);

  assert.deepEqual(filterManagedPropertyRows(rows, "www.devbrew").map((row) => row.name), ["DevBrew Website"]);
});

test("getManagedPropertyToggleTargets toggles both linked source rows", () => {
  const [row] = buildManagedPropertyRows([
    source({
      id: "gsc_sc-domain:sfk-seilzuege.de",
      type: "gsc",
      ga4PropertyId: "513605441",
    }),
    source({
      id: "ga4_513605441",
      type: "ga4",
    }),
  ]);

  assert.deepEqual(getManagedPropertyToggleTargets(row), ["gsc_sc-domain:sfk-seilzuege.de", "ga4_513605441"]);
});

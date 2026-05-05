import assert from "node:assert/strict";
import test from "node:test";

import { formatPropertiesSyncSuccess } from "./sync-button";

test("sync success copy explains when no Google properties are associated with the account", () => {
  assert.equal(
    formatPropertiesSyncSuccess({
      gscCount: 0,
      ga4Count: 0,
      discoveredGscCount: 0,
      discoveredGa4Count: 0,
      autoLinked: 0,
    }),
    "No Google Search Console or Analytics properties are associated with this Google account yet.",
  );
});

test("sync success copy distinguishes already-synced properties from no Google properties", () => {
  assert.equal(
    formatPropertiesSyncSuccess({
      gscCount: 0,
      ga4Count: 0,
      discoveredGscCount: 7,
      discoveredGa4Count: 3,
      autoLinked: 0,
    }),
    "Google returned 7 GSC, 3 GA4. Everything was already synced.",
  );
});

test("sync success copy still reports newly synced properties", () => {
  assert.equal(
    formatPropertiesSyncSuccess({
      gscCount: 2,
      ga4Count: 1,
      discoveredGscCount: 7,
      discoveredGa4Count: 3,
      autoLinked: 1,
    }),
    "Synced 2 GSC, 1 GA4 new properties • 1 auto-linked.",
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboardHref } from "./property-dashboard-client.logic";

test("public demo dashboard filters preserve the localized demo route", () => {
  assert.equal(
    buildDashboardHref({
      propertyId: "gsc_sc-domain:acmebakery.example",
      currentSearchParams: "",
      preset: "last_28d",
      compareMode: "previous_period",
      startDate: "2026-04-11",
      endDate: "2026-05-08",
      routeMode: "publicDemo",
      language: "de",
    }),
    "/de/demo?preset=last_28d&compare=previous_period&end=2026-05-08",
  );
});

test("legacy public demo dashboard filters keep the compatibility route", () => {
  assert.equal(
    buildDashboardHref({
      propertyId: "gsc_sc-domain:acmebakery.example",
      currentSearchParams: "",
      preset: "last_28d",
      compareMode: "previous_period",
      startDate: "2026-04-11",
      endDate: "2026-05-08",
      routeMode: "publicDemo",
    }),
    "/demo?preset=last_28d&compare=previous_period&end=2026-05-08",
  );
});

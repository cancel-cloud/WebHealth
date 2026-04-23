import assert from "node:assert/strict";
import test from "node:test";
import { decodeRouteParam } from "./route-params";

test("decodeRouteParam decodes encoded property ids", () => {
  assert.equal(
    decodeRouteParam("gsc_sc-domain%3Adevbrew.dev"),
    "gsc_sc-domain:devbrew.dev",
  );
});

test("decodeRouteParam falls back to the raw value on invalid encoding", () => {
  assert.equal(decodeRouteParam("gsc_sc-domain%ZZdevbrew.dev"), "gsc_sc-domain%ZZdevbrew.dev");
});

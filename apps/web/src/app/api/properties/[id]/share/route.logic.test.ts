import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPropertyShareUrl,
  normalizeShareRequestBody,
} from "./route.logic";

test("normalizeShareRequestBody accepts the client export request", () => {
  assert.deepEqual(
    normalizeShareRequestBody({
      preset: "last_28d",
      compareMode: "previous_period",
      startDate: "2026-03-01",
      endDate: "2026-03-28",
      mode: "client",
    }),
    {
      preset: "last_28d",
      compareMode: "previous_period",
      startDate: "2026-03-01",
      endDate: "2026-03-28",
      mode: "client",
      brandProfileId: null,
    },
  );
});

test("buildPropertyShareUrl prefers the request origin", () => {
  assert.equal(
    buildPropertyShareUrl({
      requestUrl:
        "https://app.example.com/api/properties/sc-domain%3Aexample.com/share",
      token: "tok_123",
    }),
    "https://app.example.com/share/property/tok_123",
  );
});

test("buildPropertyShareUrl prefers the configured public base URL", () => {
  assert.equal(
    buildPropertyShareUrl({
      requestUrl:
        "https://localhost:3000/api/properties/sc-domain%3Aexample.com/share",
      token: "tok_123",
      baseUrl: "https://webaudit-25.localcan.dev",
    }),
    "https://webaudit-25.localcan.dev/share/property/tok_123",
  );
});

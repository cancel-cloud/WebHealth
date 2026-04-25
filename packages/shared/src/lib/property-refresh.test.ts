import assert from "node:assert/strict";
import test from "node:test";
import { matchesPropertyRefreshPayload } from "./property-refresh";

test("matchesPropertyRefreshPayload requires an exact dashboard window match", () => {
  assert.equal(
    matchesPropertyRefreshPayload(
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
    ),
    true,
  );

  assert.equal(
    matchesPropertyRefreshPayload(
      {
        preset: "last_28d",
        compareMode: "none",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
    ),
    false,
  );

  assert.equal(
    matchesPropertyRefreshPayload(
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-25",
        endDate: "2026-04-21",
      },
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
    ),
    false,
  );
});

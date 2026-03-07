import assert from "node:assert/strict";
import test from "node:test";

import {
  getDetailToastId,
  getDetailToastState,
} from "./get-details-button.logic";

test("builds a stable toast id per detail key", () => {
  assert.equal(
    getDetailToastId("rep_1:nearWin:kw-1"),
    "detail:rep_1:nearWin:kw-1"
  );
});

test("keeps the loading toast active after the request is queued", () => {
  assert.deepEqual(getDetailToastState("queued", "Fix homepage title"), {
    kind: "loading",
    message: 'Generating details for "Fix homepage title"…',
  });
});

test("returns success state when details are ready", () => {
  assert.deepEqual(getDetailToastState("ready", "Ignored"), {
    kind: "success",
    message: "Details ready",
  });
});

test("returns error state for failed detail generation", () => {
  assert.deepEqual(getDetailToastState("error", "Ignored"), {
    kind: "error",
    message: "Failed to generate details",
  });
});

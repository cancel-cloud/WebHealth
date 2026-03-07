import assert from "node:assert/strict";
import test from "node:test";

import {
  DETAIL_READY_TOAST_DURATION_MS,
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
  assert.deepEqual(
    getDetailToastState("queued", {
      detailKey: "rep_1:nearWin:kw-1",
      rowTitle: "Fix homepage title",
    }),
    {
    kind: "loading",
    id: "detail:rep_1:nearWin:kw-1",
    message: 'Generating details for "Fix homepage title"…',
    duration: Infinity,
  }
  );
});

test("returns a fresh ready toast without reusing the loading toast id", () => {
  assert.deepEqual(
    getDetailToastState("ready", {
      detailKey: "rep_1:nearWin:kw-1",
      rowTitle: "Ignored",
    }),
    {
      kind: "success",
      message: "Details ready",
      duration: DETAIL_READY_TOAST_DURATION_MS,
    }
  );
});

test("returns error state for failed detail generation", () => {
  assert.deepEqual(
    getDetailToastState("error", {
      detailKey: "rep_1:nearWin:kw-1",
      rowTitle: "Ignored",
    }),
    {
    kind: "error",
    id: "detail:rep_1:nearWin:kw-1",
    message: "Failed to generate details",
  }
  );
});

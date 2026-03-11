import assert from "node:assert/strict";
import test from "node:test";

import {
  getFeedbackModalInitialState,
  getFeedbackModalNextState,
} from "./feedback-modal-context";

test("feedback modal defaults to sidebar source with no preselected type", () => {
  assert.deepEqual(getFeedbackModalInitialState(), {
    open: false,
    source: "sidebar",
    initialType: "",
  });
});

test("feedback modal state can be opened with a source and preset type", () => {
  assert.deepEqual(
    getFeedbackModalNextState({
      source: "settings",
      initialType: "bug_report",
    }),
    {
      open: true,
      source: "settings",
      initialType: "bug_report",
    },
  );
});

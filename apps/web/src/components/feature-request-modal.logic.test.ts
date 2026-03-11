import assert from "node:assert/strict";
import test from "node:test";

import {
  getFeatureRequestDialogTitle,
  getFeatureRequestSuccessDismissDelayMs,
  getFeatureRequestInitialFocusFieldId,
  getFeatureRequestSubmissionState,
  getFeatureRequestSubmitLabel,
} from "./feature-request-modal.logic";

test("blank feature request messages stay invalid before submit", () => {
  assert.deepEqual(getFeatureRequestSubmissionState({ type: "feature_request", message: "   " }), {
    canSubmit: false,
    trimmedMessage: "",
  });
});

test("non-empty feature request messages are accepted after trim", () => {
  assert.deepEqual(getFeatureRequestSubmissionState({ type: "feature_request", message: "  Add support for CSV export  " }), {
    canSubmit: true,
    trimmedMessage: "Add support for CSV export",
  });
});

test("feature request messages stay invalid when no feedback type was selected", () => {
  assert.deepEqual(getFeatureRequestSubmissionState({ type: "", message: "I found a bug" }), {
    canSubmit: false,
    trimmedMessage: "I found a bug",
  });
});

test("submit button switches from idle to thanks after submission", () => {
  assert.equal(getFeatureRequestSubmitLabel(false), "Send request");
  assert.equal(getFeatureRequestSubmitLabel(true), "Thanks");
});

test("message field receives initial focus when the modal opens", () => {
  assert.equal(getFeatureRequestInitialFocusFieldId(), "feature-request-message");
});

test("successful submissions dismiss after one second", () => {
  assert.equal(getFeatureRequestSuccessDismissDelayMs(), 1000);
});

test("feedback modal uses a broader title than feature request", () => {
  assert.equal(getFeatureRequestDialogTitle(), "Share Feedback");
});

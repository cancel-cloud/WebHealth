import assert from "node:assert/strict";
import test from "node:test";

import { parseCreateFeedbackRequest } from "./route.logic";

test("parseCreateFeedbackRequest accepts a valid payload and trims the message", () => {
  assert.deepEqual(
    parseCreateFeedbackRequest({
      type: "feature_request",
      source: "settings",
      message: "  Add billing export  ",
    }),
    {
      ok: true,
      value: {
        type: "feature_request",
        source: "settings",
        message: "Add billing export",
      },
    },
  );
});

test("parseCreateFeedbackRequest rejects unknown feedback types", () => {
  assert.deepEqual(
    parseCreateFeedbackRequest({
      type: "other",
      source: "sidebar",
      message: "Something useful",
    }),
    { ok: false, error: "INVALID_TYPE" },
  );
});

test("parseCreateFeedbackRequest rejects unknown sources", () => {
  assert.deepEqual(
    parseCreateFeedbackRequest({
      type: "bug_report",
      source: "modal",
      message: "Something useful",
    }),
    { ok: false, error: "INVALID_SOURCE" },
  );
});

test("parseCreateFeedbackRequest rejects blank messages", () => {
  assert.deepEqual(
    parseCreateFeedbackRequest({
      type: "bug_report",
      source: "command_palette",
      message: "   ",
    }),
    { ok: false, error: "INVALID_MESSAGE" },
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import { parseAdminFeedbackQuery, parseFeedbackStatusPatch } from "./route.logic";

test("parseAdminFeedbackQuery defaults to open items and first page", () => {
  assert.deepEqual(parseAdminFeedbackQuery(new URLSearchParams()), {
    status: "open",
    q: "",
    page: 1,
    limit: 20,
    offset: 0,
  });
});

test("parseAdminFeedbackQuery trims search and clamps pagination inputs", () => {
  assert.deepEqual(
    parseAdminFeedbackQuery(
      new URLSearchParams({
        status: "resolved",
        q: "  csv export  ",
        page: "3",
        limit: "500",
      }),
    ),
    {
      status: "resolved",
      q: "csv export",
      page: 3,
      limit: 50,
      offset: 100,
    },
  );
});

test("parseAdminFeedbackQuery falls back to open for unsupported statuses", () => {
  assert.equal(parseAdminFeedbackQuery(new URLSearchParams({ status: "closed" })).status, "open");
});

test("parseFeedbackStatusPatch accepts open and resolved statuses", () => {
  assert.deepEqual(parseFeedbackStatusPatch({ status: "resolved" }), { status: "resolved" });
  assert.deepEqual(parseFeedbackStatusPatch({ status: "open" }), { status: "open" });
});

test("parseFeedbackStatusPatch rejects unsupported statuses", () => {
  assert.equal(parseFeedbackStatusPatch({ status: "closed" }), null);
});

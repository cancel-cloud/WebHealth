import assert from "node:assert/strict";
import test from "node:test";
import { normalizeActionUpdateBody } from "./route.logic";

test("normalizeActionUpdateBody accepts workflow state, assignee, and snooze metadata", () => {
  const body = normalizeActionUpdateBody({
    fingerprint: "fp",
    actionFamily: "content_refresh",
    causeFamily: "content_decay",
    remedyKey: "refresh_core_content",
    targetType: "page",
    targetKey: "/blog",
    title: "Refresh content",
    owner: "SEO",
    state: "snoozed",
    assigneeUserId: "user_123",
    assigneeEmail: "owner@example.com",
    snoozedUntil: "2026-05-01",
  });

  assert.equal(body.state, "snoozed");
  assert.equal(body.assigneeUserId, "user_123");
  assert.equal(body.assigneeEmail, "owner@example.com");
  assert.equal(body.snoozedUntil, "2026-05-01");
});

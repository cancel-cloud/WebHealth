import assert from "node:assert/strict";
import test from "node:test";

import { mapDetailRequestRows } from "./route.logic";

test("mapDetailRequestRows keeps debug payload shape and serializes createdAt", () => {
  const rows = mapDetailRequestRows([
    {
      id: "rdae_1",
      reportId: "rep_1",
      teamId: "team_1",
      teamName: "Team One",
      requestedByUserId: "user_1",
      requestedByUserEmail: "user@example.com",
      requestNumber: 2,
      kind: "nearWin",
      rowId: "keyword-abc",
      status: "success",
      usage: { inputTokens: 10, outputTokens: 2 },
      estimatedCostUsd: "0.000123",
      xRequestId: "req_123",
      xClientRequestId: "report_rep_1_detail_2_nearWin",
      error: null,
      createdAt: new Date("2026-03-05T10:00:00.000Z"),
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.requestNumber, 2);
  assert.equal(rows[0]?.kind, "nearWin");
  assert.equal(rows[0]?.createdAt, "2026-03-05T10:00:00.000Z");
  assert.equal(rows[0]?.xRequestId, "req_123");
});

import assert from "node:assert/strict";
import test from "node:test";

import { waitForReportToStart } from "./scheduled-report-actions.logic";

test("waits until the report leaves scheduled state", async () => {
  const statuses = ["scheduled", "scheduled", "queued"] as const;
  let index = 0;

  const status = await waitForReportToStart({
    intervalMs: 0,
    maxAttempts: 5,
    getStatus: async () => statuses[index++] ?? statuses.at(-1),
  });

  assert.equal(status, "queued");
});

test("throws when the report never leaves scheduled state", async () => {
  await assert.rejects(
    waitForReportToStart({
      intervalMs: 0,
      maxAttempts: 2,
      getStatus: async () => "scheduled",
    }),
    /did not leave scheduled state/
  );
});

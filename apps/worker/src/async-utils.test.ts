import assert from "node:assert/strict";
import test from "node:test";

import { withTimeout } from "./async-utils";

test("withTimeout returns the resolved value before the timeout elapses", async () => {
  const result = await withTimeout(
    new Promise<string>((resolve) => {
      setTimeout(() => resolve("ok"), 5);
    }),
    { timeoutMs: 50, label: "quick-task" },
  );

  assert.equal(result, "ok");
});

test("withTimeout rejects when the wrapped promise exceeds the timeout", async () => {
  await assert.rejects(
    () =>
      withTimeout(
        new Promise(() => {
          // Intentionally never resolves.
        }),
        { timeoutMs: 10, label: "slow-task" },
      ),
    /slow-task timed out after 10ms/,
  );
});

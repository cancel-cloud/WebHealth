import assert from "node:assert/strict";
import test from "node:test";

import { redactForLog } from "./log-sanitizer";

test("redactForLog removes token-like values from objects", () => {
  assert.deepEqual(
    redactForLog({
      accessToken: "ya29.secret",
      authorization: "Bearer abcdef",
      nested: { apiKey: "sk-secret-value" },
      message: "failed with GOCSPX-abc and npg_abc",
    }),
    {
      accessToken: "[REDACTED]",
      authorization: "[REDACTED]",
      nested: { apiKey: "[REDACTED]" },
      message: "failed with [REDACTED_GOOGLE_SECRET] and [REDACTED_DB_SECRET]",
    }
  );
});

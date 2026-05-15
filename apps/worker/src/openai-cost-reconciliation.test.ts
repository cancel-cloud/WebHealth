import assert from "node:assert/strict";
import test from "node:test";

import {
  getOpenAICostReconciliationSchedulerConfig,
  requireOpenAIAdminKey,
} from "./openai-cost-reconciliation";

test("requireOpenAIAdminKey fails with a clear config error when missing", () => {
  assert.throws(
    () => requireOpenAIAdminKey({}),
    /OPENAI_COST_RECONCILIATION_CONFIG_ERROR: OPENAI_ADMIN_KEY is required/,
  );
});

test("scheduler is disabled in one-off worker mode", () => {
  assert.deepEqual(
    getOpenAICostReconciliationSchedulerConfig({
      once: true,
      env: { OPENAI_ADMIN_KEY: "sk-admin" },
    }),
    { enabled: false, reason: "once-mode" },
  );
});

test("scheduler is enabled in long-lived worker mode when an admin key is configured", () => {
  assert.deepEqual(
    getOpenAICostReconciliationSchedulerConfig({
      once: false,
      env: {
        OPENAI_ADMIN_KEY: "sk-admin",
        OPENAI_COST_RECONCILIATION_INTERVAL_MS: "7200000",
      },
    }),
    { enabled: true, intervalMs: 7_200_000 },
  );
});

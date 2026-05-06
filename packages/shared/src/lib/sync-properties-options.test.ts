import assert from "node:assert/strict";
import test from "node:test";

import { resolvePropertySyncSideEffectOptions } from "./sync-properties-options";

test("property sync defaults keep normal sync side effects enabled", () => {
  assert.deepEqual(resolvePropertySyncSideEffectOptions(), {
    autoLink: true,
    probeDataStartDate: true,
  });
});

test("property sync supports onboarding rows-only mode", () => {
  assert.deepEqual(
    resolvePropertySyncSideEffectOptions({
      autoLink: false,
      probeDataStartDate: false,
    }),
    {
      autoLink: false,
      probeDataStartDate: false,
    },
  );
});

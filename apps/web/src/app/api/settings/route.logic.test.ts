import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSettingsPatch } from "./route.logic";

test("normalizeSettingsPatch accepts notification booleans and manual language changes", () => {
  assert.deepEqual(
    normalizeSettingsPatch({
      weeklyDigest: true,
      syncFailure: false,
      emailReceipts: true,
      preferredLanguage: "en",
    }),
    {
      patch: {
        weeklyDigest: true,
        syncFailure: false,
        emailReceipts: true,
        preferredLanguage: "en",
        preferredLanguageSource: "manual",
      },
      hasChanges: true,
    },
  );
});

test("normalizeSettingsPatch rejects unsupported language values", () => {
  assert.deepEqual(
    normalizeSettingsPatch({
      preferredLanguage: "fr",
      weeklyDigest: "yes",
    }),
    {
      patch: {},
      hasChanges: false,
    },
  );
});

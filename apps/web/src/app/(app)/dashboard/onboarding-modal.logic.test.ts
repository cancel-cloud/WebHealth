import assert from "node:assert/strict";
import test from "node:test";

import { shouldOpenOnboardingModal } from "./onboarding-modal.logic";

test("onboarding modal opens for users without completion state even when properties exist", () => {
  assert.equal(
    shouldOpenOnboardingModal({
      onboardingCompletedAt: null,
    }),
    true
  );

  assert.equal(
    shouldOpenOnboardingModal({
      onboardingCompletedAt: undefined,
    }),
    true
  );
});

test("onboarding modal stays closed after onboarding is completed or skipped", () => {
  assert.equal(
    shouldOpenOnboardingModal({
      onboardingCompletedAt: new Date("2026-05-06T10:00:00Z"),
    }),
    false
  );

  assert.equal(
    shouldOpenOnboardingModal({
      onboardingCompletedAt: "2026-05-06T10:00:00Z",
    }),
    false
  );
});

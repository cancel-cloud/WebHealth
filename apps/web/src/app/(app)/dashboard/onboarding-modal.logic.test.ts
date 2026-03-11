import assert from "node:assert/strict";
import test from "node:test";

import {
  hasWelcomedFromStorage,
  shouldOpenOnboardingModal,
} from "./onboarding-modal.logic";

test("storage flag only treats 1 as an acknowledged onboarding state", () => {
  assert.equal(hasWelcomedFromStorage("1"), true);
  assert.equal(hasWelcomedFromStorage("0"), false);
  assert.equal(hasWelcomedFromStorage(null), false);
});

test("onboarding modal opens only for first-time users without properties", () => {
  assert.equal(
    shouldOpenOnboardingModal({
      hasProperties: false,
      hasWelcomed: false,
      dismissed: false,
    }),
    true
  );

  assert.equal(
    shouldOpenOnboardingModal({
      hasProperties: true,
      hasWelcomed: false,
      dismissed: false,
    }),
    false
  );

  assert.equal(
    shouldOpenOnboardingModal({
      hasProperties: false,
      hasWelcomed: true,
      dismissed: false,
    }),
    false
  );

  assert.equal(
    shouldOpenOnboardingModal({
      hasProperties: false,
      hasWelcomed: false,
      dismissed: true,
    }),
    false
  );
});

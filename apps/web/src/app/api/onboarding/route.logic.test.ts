import assert from "node:assert/strict";
import test from "node:test";

import { parseOnboardingCompletionReason } from "./route.logic";

test("parseOnboardingCompletionReason accepts finished and skipped", () => {
  assert.equal(parseOnboardingCompletionReason("finished"), "finished");
  assert.equal(parseOnboardingCompletionReason("skipped"), "skipped");
});

test("parseOnboardingCompletionReason rejects unknown reasons", () => {
  assert.throws(
    () => parseOnboardingCompletionReason("later"),
    /finished or skipped/,
  );
  assert.throws(
    () => parseOnboardingCompletionReason(null),
    /finished or skipped/,
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { shouldUseStandaloneAgencyChrome } from "./marketing-shell.logic";

test("localized agency pages use their standalone header and footer", () => {
  assert.equal(shouldUseStandaloneAgencyChrome("/"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/de"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/en"), true);
  assert.equal(
    shouldUseStandaloneAgencyChrome("/de/seo-reporting-tool-agenturen"),
    true,
  );
  assert.equal(
    shouldUseStandaloneAgencyChrome("/en/seo-reporting-software-agencies"),
    true,
  );
  assert.equal(shouldUseStandaloneAgencyChrome("/en/"), true);
});

test("standard marketing pages keep the shared marketing shell", () => {
  assert.equal(shouldUseStandaloneAgencyChrome("/about"), false);
  assert.equal(shouldUseStandaloneAgencyChrome("/pricing"), false);
  assert.equal(shouldUseStandaloneAgencyChrome("/privacy"), false);
  assert.equal(shouldUseStandaloneAgencyChrome(null), false);
});

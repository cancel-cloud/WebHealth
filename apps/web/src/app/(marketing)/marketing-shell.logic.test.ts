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
  assert.equal(shouldUseStandaloneAgencyChrome("/pricing"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/de/pricing"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/en/pricing"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/demo"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/de/demo"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/en/demo"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/about"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/de/about"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/en/about"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/de/wissen"), true);
  assert.equal(shouldUseStandaloneAgencyChrome("/en/resources"), true);
  assert.equal(
    shouldUseStandaloneAgencyChrome(
      "/de/wissen/seo-reporting-agenturen-monatsreport",
    ),
    true,
  );
  assert.equal(
    shouldUseStandaloneAgencyChrome(
      "/en/resources/seo-reporting-agenturen-monatsreport",
    ),
    true,
  );
  assert.equal(shouldUseStandaloneAgencyChrome("/en/"), true);
});

test("standard marketing pages keep the shared marketing shell", () => {
  assert.equal(shouldUseStandaloneAgencyChrome("/privacy"), false);
  assert.equal(shouldUseStandaloneAgencyChrome(null), false);
});

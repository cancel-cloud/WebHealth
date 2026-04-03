import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCrawlRefreshGeneratePayload,
  planReportGenerationPass,
  shouldSkipExistingAiReport,
} from "./report-worker-policy";

test("planReportGenerationPass defers crawl work and xlsx when a fresh crawl job should be queued", () => {
  const plan = planReportGenerationPass({
    crawlingEnabled: true,
    skipCrawlEnqueue: false,
    hasStoredSiteChanges: false,
    hasPendingCrawlJob: false,
    requestedRunXlsx: true,
  });

  assert.equal(plan.siteChangesSource, "empty");
  assert.equal(plan.queueCrawlJob, true);
  assert.equal(plan.shouldRunXlsxAfterThisPass, false);
});

test("planReportGenerationPass keeps xlsx enabled when crawl deferral is not needed", () => {
  const plan = planReportGenerationPass({
    crawlingEnabled: true,
    skipCrawlEnqueue: true,
    hasStoredSiteChanges: true,
    hasPendingCrawlJob: false,
    requestedRunXlsx: true,
  });

  assert.equal(plan.siteChangesSource, "stored");
  assert.equal(plan.queueCrawlJob, false);
  assert.equal(plan.shouldRunXlsxAfterThisPass, true);
});

test("planReportGenerationPass does not queue duplicate crawl jobs and still delays xlsx until refresh", () => {
  const plan = planReportGenerationPass({
    crawlingEnabled: true,
    skipCrawlEnqueue: false,
    hasStoredSiteChanges: false,
    hasPendingCrawlJob: true,
    requestedRunXlsx: true,
  });

  assert.equal(plan.queueCrawlJob, false);
  assert.equal(plan.shouldRunXlsxAfterThisPass, false);
});

test("shouldSkipExistingAiReport respects force regeneration payloads", () => {
  assert.equal(
    shouldSkipExistingAiReport({ hasAiReport: true, forceRegenerate: false }),
    true,
  );
  assert.equal(
    shouldSkipExistingAiReport({ hasAiReport: true, forceRegenerate: true }),
    false,
  );
});

test("buildCrawlRefreshGeneratePayload preserves xlsx intent and prevents crawl recursion", () => {
  assert.deepEqual(buildCrawlRefreshGeneratePayload({ runXlsx: true }), {
    forceRegenerate: true,
    runXlsx: true,
    skipCrawlEnqueue: true,
  });
});

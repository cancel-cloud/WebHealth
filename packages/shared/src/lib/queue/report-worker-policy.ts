export type ReportGenerationPassPlan = {
  siteChangesSource: "stored" | "empty";
  queueCrawlJob: boolean;
  shouldRunXlsxAfterThisPass: boolean;
};

export function planReportGenerationPass(input: {
  crawlingEnabled: boolean;
  skipCrawlEnqueue: boolean;
  hasStoredSiteChanges: boolean;
  hasPendingCrawlJob: boolean;
  requestedRunXlsx: boolean;
}): ReportGenerationPassPlan {
  const siteChangesSource = input.hasStoredSiteChanges ? "stored" : "empty";
  const crawlDeferralActive =
    input.crawlingEnabled && !input.skipCrawlEnqueue;

  if (!crawlDeferralActive) {
    return {
      siteChangesSource,
      queueCrawlJob: false,
      shouldRunXlsxAfterThisPass: input.requestedRunXlsx,
    };
  }

  return {
    siteChangesSource,
    queueCrawlJob: !input.hasPendingCrawlJob,
    shouldRunXlsxAfterThisPass: false,
  };
}

export function shouldSkipExistingAiReport(input: {
  hasAiReport: boolean;
  forceRegenerate: boolean;
}) {
  return input.hasAiReport && !input.forceRegenerate;
}

export function buildCrawlRefreshGeneratePayload(input: { runXlsx: boolean }) {
  return {
    forceRegenerate: true,
    runXlsx: input.runXlsx,
    skipCrawlEnqueue: true,
  } as const;
}

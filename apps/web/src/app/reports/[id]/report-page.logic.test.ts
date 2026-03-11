import assert from "node:assert/strict";
import test from "node:test";

import {
  applyOptimisticReportRetry,
  getReportActionAvailability,
  getReportDetailViewKind,
  getScheduledNoticeState,
  shouldShowTopReportActions,
} from "./report-page.logic";

test("report retry stays enabled even when ai report json is missing", () => {
  assert.deepEqual(
    getReportActionAvailability({ hasAiReportJson: false, reportStatus: "complete" }),
    {
      canRetryReport: true,
      retryReportReason: null,
      canRetryXlsx: false,
      retryXlsxReason: "XLSX can only be re-run after an AI report has been generated.",
    }
  );
});

test("xlsx retry is enabled once ai report json exists", () => {
  assert.deepEqual(
    getReportActionAvailability({ hasAiReportJson: true, reportStatus: "complete" }),
    {
      canRetryReport: true,
      retryReportReason: null,
      canRetryXlsx: true,
      retryXlsxReason: null,
    }
  );
});

test("report retry is disabled while the initial generation is still running", () => {
  assert.deepEqual(
    getReportActionAvailability({ hasAiReportJson: false, reportStatus: "queued" }),
    {
      canRetryReport: false,
      retryReportReason: "Retry is available once the initial report generation has finished.",
      canRetryXlsx: false,
      retryXlsxReason: "XLSX can only be re-run after an AI report has been generated.",
    }
  );

  assert.deepEqual(
    getReportActionAvailability({ hasAiReportJson: false, reportStatus: "processing" }),
    {
      canRetryReport: false,
      retryReportReason: "Retry is available once the initial report generation has finished.",
      canRetryXlsx: false,
      retryXlsxReason: "XLSX can only be re-run after an AI report has been generated.",
    }
  );
});

test("scheduled report with missing ga4 shows continue anyway but not proceed with ga4", () => {
  assert.deepEqual(
    getScheduledNoticeState({ teamHasAnyGa4Properties: true, sourceValid: true, hasLinkedGa4Now: false }),
    {
      title: "This report is waiting for missing data",
      description:
        "This property is not linked to a GA4 account yet, but you can either link GA4 in Properties or continue with GSC-only data now.",
      helper:
        "You already have GA4 properties on this team. Open Properties to link one, or continue now if you want to generate the report without GA4.",
      canContinueAnyway: true,
      continueAnywayReason: null,
      canProceedWithGa4: false,
      proceedWithGa4Reason: null,
    }
  );
});

test("scheduled report with linked ga4 shows both start options", () => {
  assert.deepEqual(
    getScheduledNoticeState({ teamHasAnyGa4Properties: true, sourceValid: true, hasLinkedGa4Now: true }),
    {
      title: "This report is waiting for missing data",
      description:
        "GA4 is now linked to this property. You can continue with GSC-only data or start the report with both GSC and GA4.",
      helper:
        "You can start the report with both data sources now, or continue anyway if you want a GSC-only run.",
      canContinueAnyway: true,
      continueAnywayReason: null,
      canProceedWithGa4: true,
      proceedWithGa4Reason: null,
    }
  );
});

test("invalid scheduled report source disables both start actions", () => {
  assert.deepEqual(
    getScheduledNoticeState({ teamHasAnyGa4Properties: false, sourceValid: false, hasLinkedGa4Now: false }),
    {
      title: "This report is waiting for missing data",
      description:
        "This report can’t be started right now because its property source is no longer valid.",
      helper:
        "Open Properties to relink the property or recreate the report once the source is valid again.",
      canContinueAnyway: false,
      continueAnywayReason: "This report source is no longer valid.",
      canProceedWithGa4: false,
      proceedWithGa4Reason: "This report source is no longer valid.",
    }
  );
});

test("top action row is hidden only for scheduled reports", () => {
  assert.equal(shouldShowTopReportActions("scheduled"), false);
  assert.equal(shouldShowTopReportActions("queued"), true);
  assert.equal(shouldShowTopReportActions("complete"), true);
});

test("retrying a completed report immediately switches the detail view into the active generation state", () => {
  assert.deepEqual(
    applyOptimisticReportRetry({
      reportStatus: "complete",
      aiStatus: "complete",
      xlsxStatus: "ready",
      hasAiReportJson: true,
      hasXlsxArtifact: true,
    }),
    {
      reportStatus: "queued",
      aiStatus: "queued",
      xlsxStatus: "pending",
      hasAiReportJson: false,
      hasXlsxArtifact: false,
    }
  );

  assert.equal(getReportDetailViewKind("queued"), "active");
  assert.equal(getReportDetailViewKind("processing"), "active");
});

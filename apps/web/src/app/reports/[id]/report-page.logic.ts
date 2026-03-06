export const MISSING_AI_REPORT_XLSX_REASON =
  "XLSX can only be re-run after an AI report has been generated.";
export const INITIAL_GENERATION_RETRY_REASON =
  "Retry is available once the initial report generation has finished.";

export const INVALID_SCHEDULED_SOURCE_REASON =
  "This report source is no longer valid.";

type ReportActionAvailabilityInput = {
  hasAiReportJson: boolean;
  reportStatus: string;
};

type ScheduledNoticeStateInput = {
  teamHasAnyGa4Properties: boolean;
  sourceValid: boolean;
  hasLinkedGa4Now: boolean;
};

export function getReportActionAvailability(input: ReportActionAvailabilityInput) {
  if (input.reportStatus === "queued" || input.reportStatus === "processing") {
    return {
      canRetryReport: false,
      retryReportReason: INITIAL_GENERATION_RETRY_REASON,
      canRetryXlsx: false,
      retryXlsxReason: MISSING_AI_REPORT_XLSX_REASON,
    };
  }

  if (!input.hasAiReportJson) {
    return {
      canRetryReport: true,
      retryReportReason: null,
      canRetryXlsx: false,
      retryXlsxReason: MISSING_AI_REPORT_XLSX_REASON,
    };
  }

  return {
    canRetryReport: true,
    retryReportReason: null,
    canRetryXlsx: true,
    retryXlsxReason: null,
  };
}

export function getScheduledNoticeState(input: ScheduledNoticeStateInput) {
  if (!input.sourceValid) {
    return {
      title: "This report is waiting for missing data",
      description:
        "This report can’t be started right now because its property source is no longer valid.",
      helper:
        "Open Properties to relink the property or recreate the report once the source is valid again.",
      canContinueAnyway: false,
      continueAnywayReason: INVALID_SCHEDULED_SOURCE_REASON,
      canProceedWithGa4: false,
      proceedWithGa4Reason: INVALID_SCHEDULED_SOURCE_REASON,
    };
  }

  if (input.hasLinkedGa4Now) {
    return {
      title: "This report is waiting for missing data",
      description:
        "GA4 is now linked to this property. You can continue with GSC-only data or start the report with both GSC and GA4.",
      helper:
        "You can start the report with both data sources now, or continue anyway if you want a GSC-only run.",
      canContinueAnyway: true,
      continueAnywayReason: null,
      canProceedWithGa4: true,
      proceedWithGa4Reason: null,
    };
  }

  return {
    title: "This report is waiting for missing data",
    description:
      "This property is not linked to a GA4 account yet, but you can either link GA4 in Properties or continue with GSC-only data now.",
    helper: input.teamHasAnyGa4Properties
      ? "You already have GA4 properties on this team. Open Properties to link one, or continue now if you want to generate the report without GA4."
      : "No GA4 properties are available on this team yet. Open Properties to sync and link GA4 later, or continue now to generate the report with GSC-only data.",
    canContinueAnyway: true,
    continueAnywayReason: null,
    canProceedWithGa4: false,
    proceedWithGa4Reason: null,
  };
}

export function shouldShowTopReportActions(status: string) {
  return status !== "scheduled";
}

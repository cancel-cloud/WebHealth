export type ReportStatus = "queued" | "processing" | "complete" | "failed" | string;
export type XlsxStatus = "pending" | "generating" | "ready" | "failed" | string | null | undefined;

function isActiveReportStatus(status: ReportStatus): boolean {
  return status === "queued" || status === "processing";
}

function isActiveXlsxStatus(status: XlsxStatus): boolean {
  return status === "pending" || status === "generating";
}

export function shouldPollReportLiveStatus(
  reportStatus: ReportStatus,
  xlsxStatus: XlsxStatus
): boolean {
  if (reportStatus === "scheduled") return false;
  return isActiveReportStatus(reportStatus) || isActiveXlsxStatus(xlsxStatus);
}

export type ReportStatus = "queued" | "processing" | "complete" | "failed" | string;
export type XlsxStatus = "pending" | "generating" | "ready" | "failed" | string | null | undefined;

function isActiveReportStatus(status: ReportStatus): boolean {
  return status === "queued" || status === "processing";
}

function isActiveXlsxStatus(status: XlsxStatus): boolean {
  return status === "pending" || status === "generating";
}

export function hasActiveReportLiveStatus(
  reportStatus: ReportStatus,
  xlsxStatus: XlsxStatus
): boolean {
  return isActiveReportStatus(reportStatus) || isActiveXlsxStatus(xlsxStatus);
}

export function shouldPollReportLiveStatus(
  reportStatus: ReportStatus,
  xlsxStatus: XlsxStatus
): boolean {
  if (reportStatus === "scheduled") return false;
  return hasActiveReportLiveStatus(reportStatus, xlsxStatus);
}

export function shouldIgnoreTerminalPollResult({
  currentStatus,
  currentXlsxStatus,
  nextStatus,
  nextXlsxStatus,
  hasConfirmedActiveServerState,
}: {
  currentStatus: ReportStatus;
  currentXlsxStatus: XlsxStatus;
  nextStatus: ReportStatus;
  nextXlsxStatus: XlsxStatus;
  hasConfirmedActiveServerState: boolean;
}): boolean {
  if (hasConfirmedActiveServerState) return false;

  return (
    hasActiveReportLiveStatus(currentStatus, currentXlsxStatus) &&
    !hasActiveReportLiveStatus(nextStatus, nextXlsxStatus)
  );
}

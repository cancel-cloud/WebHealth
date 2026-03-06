import type { ReportStatus } from "./report-live-status.logic";

type WaitForReportToStartOptions = {
  getStatus: () => Promise<ReportStatus | null | undefined>;
  intervalMs?: number;
  maxAttempts?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForReportToStart({
  getStatus,
  intervalMs = 250,
  maxAttempts = 20,
}: WaitForReportToStartOptions): Promise<ReportStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getStatus();
    if (status && status !== "scheduled") return status;
    if (attempt < maxAttempts - 1) {
      await sleep(intervalMs);
    }
  }

  throw new Error("Report did not leave scheduled state");
}

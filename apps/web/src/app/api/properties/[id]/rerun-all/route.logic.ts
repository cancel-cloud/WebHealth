import { badRequest } from "@webhealth/shared/lib/http-errors";

type StepResult = {
  status: "queued" | "complete" | "failed" | "skipped";
  jobId?: string | null;
  jobIds?: string[];
  windows?: Array<{ dateStart: string; dateEnd: string }>;
  message?: string | null;
};

function isDateString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function normalizeRerunAllRequestBody(body: Record<string, unknown>) {
  if (
    typeof body.preset !== "string" ||
    typeof body.compareMode !== "string" ||
    !isDateString(body.startDate) ||
    !isDateString(body.endDate)
  ) {
    throw badRequest("INVALID_RERUN_WINDOW", "A valid rerun window is required.");
  }

  return {
    preset: body.preset,
    compareMode: body.compareMode,
    startDate: body.startDate,
    endDate: body.endDate,
    compareStartDate: isDateString(body.compareStartDate) ? body.compareStartDate : null,
    compareEndDate: isDateString(body.compareEndDate) ? body.compareEndDate : null,
  };
}

export function buildRerunAllResponse(params: {
  dataRefresh: StepResult;
  crawlRefresh: StepResult;
  decisionRefresh: StepResult;
}) {
  const steps = [params.dataRefresh, params.crawlRefresh, params.decisionRefresh];
  const failed = steps.filter((step) => step.status === "failed");
  const status = failed.length
    ? failed.length === steps.length
      ? "failed"
      : "partial"
    : "queued";

  return {
    status,
    dataRefresh: params.dataRefresh,
    crawlRefresh: params.crawlRefresh,
    decisionRefresh: params.decisionRefresh,
    warnings: failed.map((step) => step.message).filter((message): message is string => Boolean(message)),
  };
}

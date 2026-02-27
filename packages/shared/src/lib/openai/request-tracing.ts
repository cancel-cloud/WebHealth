export function makeClientRequestId(params: {
  reportId: string;
  jobId: string;
  phase: string;
}) {
  const phase = params.phase.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `report_${params.reportId}_job_${params.jobId}_${phase}`;
}

export function extractOpenAIRequestId(headers: Headers | Record<string, string | string[] | undefined>) {
  if (headers instanceof Headers) {
    return headers.get("x-request-id");
  }

  const value = headers["x-request-id"];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

import { NextResponse } from "next/server";

// Deprecated route kept as a guardrail.
// Report processing now runs exclusively through DB queue + worker.
export async function POST() {
  return NextResponse.json(
    {
      error: "Report processing endpoint disabled",
      message:
        "This endpoint is deprecated. Reports are processed via the report_jobs queue by apps/worker.",
      next: {
        createReport: "POST /api/reports",
        startScheduledReport: "POST /api/reports/[id]/start",
        retryReport: "POST /api/reports/[id]/retry",
      },
    },
    { status: 410 }
  );
}

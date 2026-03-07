import { NextResponse } from "next/server";
import { listReportJobEvents } from "@webhealth/shared/lib/queue/report-jobs";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET(req: Request) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId") ?? undefined;
    const jobId = searchParams.get("jobId") ?? undefined;
    const teamId = searchParams.get("teamId") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);

    const events = await listReportJobEvents({ reportId, jobId, teamId, limit });
    return NextResponse.json({ events });
  } catch (error) {
    return handleRouteError("Error fetching AI report events", error);
  }
}

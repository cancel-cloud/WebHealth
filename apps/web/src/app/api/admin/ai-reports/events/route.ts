import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@webhealth/shared/lib/auth";
import { listReportJobEvents } from "@webhealth/shared/lib/queue/report-jobs";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId") ?? undefined;
    const jobId = searchParams.get("jobId") ?? undefined;
    const teamId = searchParams.get("teamId") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "200", 10);

    const events = await listReportJobEvents({ reportId, jobId, teamId, limit });
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

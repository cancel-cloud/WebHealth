import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { listReportJobEvents } from "@webhealth/shared/lib/queue/report-jobs";
import { and, eq, inArray } from "drizzle-orm";
import { reports } from "@webhealth/shared/db/schema";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { requireAnyTeamMembership, requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUnrestrictedSession();
    const { id: reportId } = await params;

    const userTeams = await requireAnyTeamMembership(session);
    const teamIds = userTeams.map((row) => row.teamId);
    if (!teamIds.length) throw badRequest("TEAM_NOT_FOUND", "No team found");

    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    });
    if (!report) throw notFound("Report not found", "REPORT_NOT_FOUND");

    const events = await listReportJobEvents({ reportId, limit: 300 });
    return NextResponse.json({ events });
  } catch (error) {
    return handleRouteError("Error fetching report events", error);
  }
}

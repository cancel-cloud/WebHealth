import { NextResponse } from 'next/server';
import { db } from "@webhealth/shared/db";
import { getActiveJobSummaryForReport } from "@webhealth/shared/lib/queue/report-jobs";
import { and, eq, inArray } from 'drizzle-orm';
import { reports } from "@webhealth/shared/db/schema";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { requireAnyTeamMembership, requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

// GET /api/reports/[id] — fetch a single report for status polling
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUnrestrictedSession();

    const { id: reportId } = await params;

    const userTeams = await requireAnyTeamMembership(session);
    const teamIds = userTeams.map((row) => row.teamId);
    if (teamIds.length === 0) {
      throw badRequest("TEAM_NOT_FOUND", "No team found");
    }

    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    });
    if (!report) {
      throw notFound("Report not found or unauthorized", "REPORT_NOT_FOUND");
    }

    const jobs = await getActiveJobSummaryForReport(reportId);
    const aiJson = (report.aiReportJson ?? null) as Record<string, unknown> | null;
    const summary = {
      kpiTrendPoints: Array.isArray(aiJson?.kpiTrendRows)
        ? (aiJson?.kpiTrendRows as unknown[]).length
        : 0,
      queryOpportunities: Array.isArray(aiJson?.queryOpportunityRows)
        ? (aiJson?.queryOpportunityRows as unknown[]).length
        : 0,
      actionBacklogItems: Array.isArray(aiJson?.actionBacklogRows)
        ? (aiJson?.actionBacklogRows as unknown[]).length
        : 0,
    };
    return NextResponse.json({ report, jobs, summary });
  } catch (error) {
    return handleRouteError("Error fetching report", error);
  }
}

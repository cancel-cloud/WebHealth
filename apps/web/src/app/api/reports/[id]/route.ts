import { NextResponse } from 'next/server';
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { headers } from 'next/headers';
import { getActiveJobSummaryForReport } from "@webhealth/shared/lib/queue/report-jobs";
import { and, eq, inArray } from 'drizzle-orm';
import { reports } from "@webhealth/shared/db/schema";

// GET /api/reports/[id] — fetch a single report for status polling
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: reportId } = await params;

    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    const teamIds = userTeams.map((row) => row.teamId);
    if (teamIds.length === 0) {
      return NextResponse.json({ error: 'No team found' }, { status: 400 });
    }

    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    });
    if (!report) {
      return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 });
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
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

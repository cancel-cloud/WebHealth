import { NextResponse } from 'next/server';
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { reports } from "@webhealth/shared/db/schema";
import { and, eq, inArray } from 'drizzle-orm';
import { headers } from 'next/headers';
import { enqueueReportJob } from "@webhealth/shared/lib/queue/report-jobs";
import { resolveReportSourcesForExistingReport } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { shouldAllowScheduledStart } from "./route.logic";

// POST /api/reports/[id]/start — promote a scheduled report to queued and fire processing
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const forceWithoutGa4 = body?.forceWithoutGa4 === true;

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
    if (report.status !== 'scheduled') {
      return NextResponse.json({ error: 'Report is not in scheduled status' }, { status: 400 });
    }

    // Verify the canonical report source now has a GA4 link (handles legacy reports stored on GA4 rows).
    let resolvedSources;
    try {
      resolvedSources = await resolveReportSourcesForExistingReport(report);
    } catch {
      return NextResponse.json({ error: 'Report property is invalid or no longer linked' }, { status: 400 });
    }
    if (!shouldAllowScheduledStart({
      hasLinkedGa4: !!resolvedSources.canonicalGscProperty.ga4PropertyId,
      forceWithoutGa4,
    })) {
      return NextResponse.json({ error: 'Property still has no GA4 link' }, { status: 400 });
    }

    await db.update(reports).set({ status: 'queued' }).where(eq(reports.id, reportId));

    await enqueueReportJob({
      reportId,
      teamId: report.teamId,
      kind: 'generate_report',
      payload: { runXlsx: true, source: 'start_scheduled' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error starting report:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

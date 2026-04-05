import { NextResponse } from 'next/server';
import { db } from "@webhealth/shared/db";
import { reports } from "@webhealth/shared/db/schema";
import { and, eq } from 'drizzle-orm';
import { enqueueReportJob } from "@webhealth/shared/lib/queue/report-jobs";
import { resolveReportSourcesForExistingReport } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { shouldAllowScheduledStart } from "./route.logic";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { requireTeamOwner, requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import {
  getGoogleAccessHealthForUser,
  shouldBlockGoogleAction,
  toGoogleAccessPublicError,
} from "@/lib/server/google-access";

// POST /api/reports/[id]/start — promote a scheduled report to queued and fire processing
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUnrestrictedSession();
    const ownerMembership = await requireTeamOwner(session);

    const health = await getGoogleAccessHealthForUser(session.user.id);
    if (shouldBlockGoogleAction(health)) {
      const publicError = toGoogleAccessPublicError(health);
      if (publicError) {
        return NextResponse.json(publicError.body, { status: publicError.status });
      }
    }

    const body = await req.json().catch(() => ({}));
    const forceWithoutGa4 = body?.forceWithoutGa4 === true;

    const { id: reportId } = await params;

    // TODO(team-authz): Current product behavior assumes one effective team per user.
    // When real multi-team support is added, authorize against report.teamId instead of ownerMembership.teamId.
    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), eq(reports.teamId, ownerMembership.teamId)),
    });
    if (!report) {
      throw notFound("Report not found or unauthorized", "REPORT_NOT_FOUND");
    }
    if (report.status !== 'scheduled') {
      throw badRequest("REPORT_NOT_SCHEDULED", "Report is not in scheduled status");
    }

    // Verify the canonical report source now has a GA4 link (handles legacy reports stored on GA4 rows).
    let resolvedSources;
    try {
      resolvedSources = await resolveReportSourcesForExistingReport(report);
    } catch {
      throw badRequest("INVALID_REPORT_PROPERTY", "Report property is invalid or no longer linked");
    }
    if (!shouldAllowScheduledStart({
      hasLinkedGa4: !!resolvedSources.canonicalGscProperty.ga4PropertyId,
      forceWithoutGa4,
    })) {
      throw badRequest("GA4_LINK_REQUIRED", "Property still has no GA4 link");
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
    return handleRouteError("Error starting report", error);
  }
}

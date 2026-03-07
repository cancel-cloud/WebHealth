import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { reports } from "@webhealth/shared/db/schema";
import { enqueueReportJob } from "@webhealth/shared/lib/queue/report-jobs";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { requireAnyTeamMembership, requireTeamOwner, requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUnrestrictedSession();
    const ownerMembership = await requireTeamOwner(session);

    const { id: reportId } = await params;
    // TODO(team-authz): Current product behavior assumes one effective team per user.
    // When real multi-team support is added, authorize against report.teamId instead of ownerMembership.teamId.
    const teamIds = [ownerMembership.teamId];

    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    });
    if (!report) throw notFound("Report not found", "REPORT_NOT_FOUND");

    await db
      .update(reports)
      .set({
        status: "queued",
        aiStatus: "queued",
        xlsxStatus: "pending",
        aiUsage: null,
        aiEstimatedCostUsd: null,
        openaiResponseId: null,
        openaiRequestIds: null,
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId));

    const job = await enqueueReportJob({
      reportId,
      teamId: report.teamId,
      kind: "generate_report",
      payload: { runXlsx: true, source: "retry" },
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error) {
    return handleRouteError("Error retrying report", error);
  }
}

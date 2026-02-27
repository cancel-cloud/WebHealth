import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { reports } from "@webhealth/shared/db/schema";
import { enqueueReportJob } from "@webhealth/shared/lib/queue/report-jobs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: reportId } = await params;
    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    const teamIds = userTeams.map((row) => row.teamId);
    if (!teamIds.length) return NextResponse.json({ error: "No team found" }, { status: 400 });

    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    });
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    if (!report.aiReportJson) {
      return NextResponse.json({ error: "No AI report JSON available for XLSX rendering" }, { status: 400 });
    }

    await db
      .update(reports)
      .set({
        xlsxStatus: "pending",
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId));

    const job = await enqueueReportJob({
      reportId,
      teamId: report.teamId,
      kind: "render_xlsx",
      payload: { source: "retry_xlsx" },
    });

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { and, eq, inArray } from "drizzle-orm";
import { reports } from "@webhealth/shared/db/schema";
import { resolveReportArtifactBinary } from "@/lib/reports/resolve-report-artifact";

export async function GET(
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
    if (!report.xlsxArtifactKey) {
      return NextResponse.json({ error: "No XLSX artifact available" }, { status: 404 });
    }

    const artifactResult = await resolveReportArtifactBinary({
      artifactKey: report.xlsxArtifactKey,
      workerBaseUrl: process.env.WORKER_ARTIFACT_URL,
      workerSecret: process.env.WORKER_API_SECRET,
    });

    if (!artifactResult.ok) {
      return NextResponse.json({ error: artifactResult.error }, { status: artifactResult.status });
    }

    const data = artifactResult.data;
    return new NextResponse(data, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="seo-report-${reportId}.xlsx"`,
        "Content-Length": String(data.byteLength),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

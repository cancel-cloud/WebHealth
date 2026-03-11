import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { and, eq, inArray } from "drizzle-orm";
import { reports } from "@webhealth/shared/db/schema";
import { mintArtifactDownloadToken } from "@webhealth/shared/lib/artifact-token";
import { resolveReportArtifactBinary } from "@/lib/reports/resolve-report-artifact";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { requireAnyTeamMembership, requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError, reportHandledRouteFailure } from "@/lib/server/route-security";

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
    if (!report.xlsxArtifactKey) {
      throw notFound("No XLSX artifact available", "XLSX_NOT_FOUND");
    }

    const artifactToken = mintArtifactDownloadToken({
      artifactKey: report.xlsxArtifactKey,
      reportId,
    });

    const artifactResult = await resolveReportArtifactBinary({
      artifactKey: report.xlsxArtifactKey,
      workerBaseUrl: process.env.WORKER_ARTIFACT_URL,
      artifactToken,
    });

    if (!artifactResult.ok) {
      reportHandledRouteFailure({
        label: "Error downloading report artifact",
        status: artifactResult.status,
        code: artifactResult.code,
        message: `Artifact download failed: ${artifactResult.code}`,
        context: {
          reportId,
          artifactKey: report.xlsxArtifactKey,
          workerConfigured: Boolean(process.env.WORKER_ARTIFACT_URL),
        },
      });

      return NextResponse.json(
        { error: artifactResult.error, code: artifactResult.code },
        { status: artifactResult.status }
      );
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
    return handleRouteError("Error downloading report artifact", error);
  }
}

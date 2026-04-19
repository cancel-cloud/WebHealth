import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { reports, teamUsage } from "@webhealth/shared/db/schema";
import { enqueueReportJob } from "@webhealth/shared/lib/queue/report-jobs";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import { nanoid } from "nanoid";
import type { AiSeoReport } from "@webhealth/shared/lib/reports/types";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import {
  findRow,
  isRowType,
  shouldGenerateDetail,
} from "@webhealth/shared/lib/report-detail";
import {
  requireAnyTeamMembership,
  requireTeamOwner,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUnrestrictedSession();
    const ownerMembership = await requireTeamOwner(session);
    const { id: reportId } = await params;
    const body = (await req.json()) as { rowType?: string; rowId?: string };
    const rowTypeValue = body.rowType;
    const rowId = body.rowId;

    if (!rowTypeValue || !rowId) {
      throw badRequest("DETAIL_ROW_REQUIRED", "rowType and rowId are required");
    }
    if (!isRowType(rowTypeValue)) {
      throw badRequest("INVALID_ROW_TYPE", "Invalid rowType");
    }

    // TODO(team-authz): Current product behavior assumes one effective team per user.
    // When real multi-team support is added, authorize against report.teamId instead of ownerMembership.teamId.
    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), eq(reports.teamId, ownerMembership.teamId)),
    });
    if (!report) {
      throw notFound("Report not found", "REPORT_NOT_FOUND");
    }

    const aiReport = report.aiReportJson as AiSeoReport | null;
    if (!aiReport) {
      throw notFound("No AI report data", "AI_REPORT_NOT_FOUND");
    }

    const rowData = findRow(aiReport, rowTypeValue, rowId);
    if (!rowData) {
      throw notFound("Row not found", "DETAIL_ROW_NOT_FOUND");
    }
    if (!shouldGenerateDetail(rowData)) {
      return NextResponse.json({ actionDetail: rowData.actionDetail, ready: true });
    }

    // Plan enforcement — check monthly detail expansion limit
    const yearMonth = new Date().toISOString().slice(0, 7);
    const teamRecord = await db.query.teams.findFirst({
      where: (t, { eq }) => eq(t.id, report.teamId),
      columns: { tier: true },
    });
    const planRecord = await db.query.planSettings.findFirst({
      where: (ps, { eq }) => eq(ps.tier, teamRecord?.tier ?? "free"),
      columns: { detailsPerMonth: true },
    });
    const detailLimit = planRecord?.detailsPerMonth ?? null;
    if (detailLimit !== null) {
      const usageRecord = await db.query.teamUsage.findFirst({
        where: (u, { and, eq }) => and(eq(u.teamId, report.teamId), eq(u.yearMonth, yearMonth)),
        columns: { detailsCount: true },
      });
      if ((usageRecord?.detailsCount ?? 0) >= detailLimit) {
        return NextResponse.json(
          { error: "DETAIL_LIMIT_EXCEEDED", message: "Monthly AI detail limit reached. Upgrade to expand more actions.", limit: detailLimit },
          { status: 429 }
        );
      }
    }
    // Upsert usage counter
    await db.insert(teamUsage)
      .values({ id: `usage_${nanoid(12)}`, teamId: report.teamId, yearMonth, detailsCount: 1 })
      .onConflictDoUpdate({
        target: [teamUsage.teamId, teamUsage.yearMonth],
        set: { detailsCount: sql`${teamUsage.detailsCount} + 1` },
      });

    const job = await enqueueReportJob({
      reportId,
      teamId: report.teamId,
      kind: "generate_detail",
      priority: 90,
      payload: {
        rowType: rowTypeValue,
        rowId,
        requestedByUserId: session.user.id,
      },
    });

    void recordProductEvent({
      teamId: report.teamId,
      userId: session.user.id,
      name: "report_detail_requested",
      source: "report_detail",
      entityType: "report",
      entityId: reportId,
      properties: {
        rowType: rowTypeValue,
        rowId,
        reportSource: report.source,
      },
    }).catch(() => {});

    return NextResponse.json({
      ready: false,
      queued: true,
      jobId: job.id,
    });
  } catch (error) {
    return handleRouteError("Error queueing detail generation", error);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUnrestrictedSession();
    const { id: reportId } = await params;
    const { searchParams } = new URL(req.url);
    const rowTypeValue = searchParams.get("rowType");
    const rowId = searchParams.get("rowId");

    if (!rowTypeValue || !rowId) {
      throw badRequest("DETAIL_ROW_REQUIRED", "rowType and rowId are required");
    }
    if (!isRowType(rowTypeValue)) {
      throw badRequest("INVALID_ROW_TYPE", "Invalid rowType");
    }

    const memberships = await requireAnyTeamMembership(session);
    const teamIds = memberships.map((membership) => membership.teamId);
    const report = await db.query.reports.findFirst({
      where: and(eq(reports.id, reportId), inArray(reports.teamId, teamIds)),
    });
    if (!report) {
      throw notFound("Report not found", "REPORT_NOT_FOUND");
    }

    const aiReport = report.aiReportJson as AiSeoReport | null;
    if (!aiReport) {
      throw notFound("No AI report data", "AI_REPORT_NOT_FOUND");
    }

    const rowData = findRow(aiReport, rowTypeValue, rowId);
    if (!rowData) {
      throw notFound("Row not found", "DETAIL_ROW_NOT_FOUND");
    }

    const actionDetail =
      typeof rowData.actionDetail === "string" && rowData.actionDetail.length > 0
        ? rowData.actionDetail
        : null;

    return NextResponse.json(
      { actionDetail, ready: actionDetail != null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return handleRouteError("Error polling detail generation", error);
  }
}

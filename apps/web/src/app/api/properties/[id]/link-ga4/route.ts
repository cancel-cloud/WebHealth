import { NextResponse } from 'next/server';
import { db } from "@webhealth/shared/db";
import { properties, reports, systemLogs } from "@webhealth/shared/db/schema";
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { enqueueReportJob } from "@webhealth/shared/queue";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { handleRouteError } from "@/lib/server/route-security";
import { requireTeamOwner, requireUnrestrictedSession } from "@/lib/server/authz";

// PATCH /api/properties/[id]/link-ga4
// Body: { ga4PropertyId: string } — numeric ID like "123456789"
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUnrestrictedSession();
    const ownerMembership = await requireTeamOwner(session);

    const { id: gscPropertyId } = await params;
    const body = await req.json();
    const { ga4PropertyId } = body;

    if (!ga4PropertyId) {
      throw badRequest("GA4_PROPERTY_REQUIRED", "ga4PropertyId is required");
    }
    const teamId = ownerMembership.teamId;

    // Verify the GSC property belongs to this team and is type 'gsc'
    const gscProp = await db.query.properties.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.id, gscPropertyId), eq(p.teamId, teamId), eq(p.type, 'gsc')),
    });
    if (!gscProp) {
      throw notFound("GSC property not found or unauthorized", "GSC_PROPERTY_NOT_FOUND");
    }

    // Verify the GA4 property exists on the same team
    const ga4DbId = `ga4_${ga4PropertyId}`;
    const ga4Prop = await db.query.properties.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.id, ga4DbId), eq(p.teamId, teamId), eq(p.type, 'ga4')),
    });
    if (!ga4Prop) {
      throw notFound("GA4 property not found or unauthorized", "GA4_PROPERTY_NOT_FOUND");
    }

    // Link GSC → GA4
    await db
      .update(properties)
      .set({ ga4PropertyId })
      .where(eq(properties.id, gscPropertyId));

    // Find any scheduled reports for this property and promote them to queued
    const scheduledReports = await db.query.reports.findMany({
      where: (r, { and, eq }) =>
        and(eq(r.propertyId, gscPropertyId), eq(r.status, 'scheduled')),
    });

    let jobsEnqueued = 0;
    for (const report of scheduledReports) {
      await db.update(reports).set({ status: 'queued' }).where(eq(reports.id, report.id));
      await enqueueReportJob({
        reportId: report.id,
        teamId: report.teamId,
        kind: "generate_report",
        payload: { runXlsx: true, source: "link_ga4" },
      });
      jobsEnqueued += 1;
    }

    db.insert(systemLogs).values({
      id: `log_${nanoid(12)}`,
      action: 'property_link_ga4',
      triggeredBy: session.user.id,
      targetUserId: session.user.id,
      status: 'success',
      details: {
        gscPropertyId,
        ga4PropertyId,
        scheduledReportsStarted: scheduledReports.length,
        jobsEnqueued,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      scheduledReportsStarted: scheduledReports.length,
      jobsEnqueued,
    });
  } catch (error) {
    return handleRouteError("Error linking GA4", error);
  }
}

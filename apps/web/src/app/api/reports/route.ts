import { NextResponse } from 'next/server';
import { db } from "@webhealth/shared/db";
import { reports, systemLogs } from "@webhealth/shared/db/schema";
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { isEnabled } from "@webhealth/shared/lib/feature-flags";
import { getGoogleAuthClient } from "@webhealth/shared/lib/google/api";
import { ensureMetricsCoverageForReport, rangeDaysInclusive } from "@webhealth/shared/lib/metrics-cache";
import { enqueueReportJob } from "@webhealth/shared/lib/queue/report-jobs";
import { resolveTeamReportSources } from "@webhealth/shared/lib/properties/reportable-properties-db";
import { getGoogleAccountTokensForUser } from "@webhealth/shared/lib/provider-tokens";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { requireAnyTeamMembership, requireTeamOwner, requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

function throwSafePropertyResolutionError(error: unknown): never {
  const message = error instanceof Error ? error.message : "Property not found or unauthorized";
  if (/not linked to a Google Search Console property/i.test(message)) {
    throw badRequest(
      "INVALID_PROPERTY",
      "The selected property is not linked to a Google Search Console property"
    );
  }
  throw notFound("Property not found", "PROPERTY_NOT_FOUND");
}

// GET /api/reports — fetch all reports for the current user's team
export async function GET() {
  try {
    const session = await requireUnrestrictedSession();

    const userTeams = await requireAnyTeamMembership(session);
    if (userTeams.length === 0) return NextResponse.json({ reports: [] });

    const teamId = userTeams[0].teamId;
    const teamReports = await db.query.reports.findMany({
      where: (r, { eq }) => eq(r.teamId, teamId),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });

    return NextResponse.json({ reports: teamReports });
  } catch (error: unknown) {
    return handleRouteError("Error fetching reports", error);
  }
}

// POST /api/reports — create a new report and queue it
export async function POST(req: Request) {
  try {
    const session = await requireUnrestrictedSession();
    const ownerMembership = await requireTeamOwner(session);

    const body = await req.json();
    const { propertyId, dateRangeStart, dateRangeEnd, compareRangeStart, compareRangeEnd } = body;

    if (!propertyId || !dateRangeStart || !dateRangeEnd || !compareRangeStart || !compareRangeEnd) {
      throw badRequest("MISSING_REQUIRED_FIELDS", "Missing required fields");
    }
    if (rangeDaysInclusive(dateRangeStart, dateRangeEnd) < 7) {
      throw badRequest("REPORT_RANGE_TOO_SHORT", "Report range must be at least 7 days");
    }
    if (rangeDaysInclusive(compareRangeStart, compareRangeEnd) < 7) {
      throw badRequest("COMPARE_RANGE_TOO_SHORT", "Compare range must be at least 7 days");
    }
    const teamId = ownerMembership.teamId;

    let resolvedSources;
    try {
      resolvedSources = await resolveTeamReportSources(teamId, propertyId);
    } catch (error) {
      throwSafePropertyResolutionError(error);
    }

    const property = resolvedSources.canonicalGscProperty;
    const canonicalPropertyId = resolvedSources.canonicalReportPropertyId;

    const ga4Missing = !property.ga4PropertyId;
    const scheduledReportsEnabled = await isEnabled('scheduled_reports_enabled', session.user.id);
    // If scheduled_reports_enabled is off for this user, treat ga4Missing as false (don't schedule)
    const shouldSchedule = ga4Missing && scheduledReportsEnabled;
    const reportId = `rep_${nanoid(12)}`;

    const [newReport] = await db
      .insert(reports)
      .values({
        id: reportId,
        teamId,
        propertyId: canonicalPropertyId,
        dateRangeStart,
        dateRangeEnd,
        compareRangeStart,
        compareRangeEnd,
        status: shouldSchedule ? 'scheduled' : 'queued',
      })
      .returning();

    if (!shouldSchedule) {
      try {
        await db.update(reports).set({ status: 'waiting_for_metrics' }).where(eq(reports.id, reportId));

        const teamOwner = await db.query.teamMembers.findFirst({
          where: (tm, { and, eq }) => and(eq(tm.teamId, teamId), eq(tm.role, 'owner')),
        });

        const googleAccount = teamOwner
          ? await getGoogleAccountTokensForUser(teamOwner.userId)
          : null;

        if (googleAccount?.accessToken) {
          const authClient = getGoogleAuthClient(
            googleAccount.accessToken,
            googleAccount.refreshToken ?? undefined
          );
          await ensureMetricsCoverageForReport({
            teamId,
            triggeredByUserId: teamOwner?.userId ?? session.user.id,
            property,
            dateRangeStart,
            dateRangeEnd,
            compareRangeStart,
            compareRangeEnd,
            authClient,
            refreshRecentDays: 7,
          });
        }

        await db.update(reports).set({ status: 'queued' }).where(eq(reports.id, reportId));
      } catch (preflightError) {
        const message = preflightError instanceof Error ? preflightError.message : 'Metrics preflight failed';
        await db.update(reports).set({ status: 'failed' }).where(eq(reports.id, reportId));
        throw new Error(message);
      }

      await enqueueReportJob({
        reportId,
        teamId,
        kind: 'generate_report',
        payload: { runXlsx: true, source: 'user_create' },
      });
    }

    db.insert(systemLogs).values({
      id: `log_${nanoid(12)}`,
      action: 'report_create',
      triggeredBy: session.user.id,
      targetUserId: session.user.id,
      status: 'success',
      details: {
        reportId,
        propertyId: canonicalPropertyId,
        requestedPropertyId: propertyId,
        teamId,
        scheduled: shouldSchedule,
        metricsPreflight: !shouldSchedule,
      },
    }).catch(() => {});

    return NextResponse.json({ report: newReport, ga4Missing: shouldSchedule }, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError("Error creating report", error);
  }
}

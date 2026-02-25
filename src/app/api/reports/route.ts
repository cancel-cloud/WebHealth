import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { reports, systemLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';
import { isEnabled } from '@/lib/feature-flags';
import { getGoogleAuthClient } from '@/lib/google/api';
import { ensureMetricsCoverageForReport, rangeDaysInclusive } from '@/lib/metrics-cache';

// GET /api/reports — fetch all reports for the current user's team
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    if (userTeams.length === 0) return NextResponse.json({ reports: [] });

    const teamId = userTeams[0].teamId;
    const teamReports = await db.query.reports.findMany({
      where: (r, { eq }) => eq(r.teamId, teamId),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });

    return NextResponse.json({ reports: teamReports });
  } catch (error: unknown) {
    console.error('Error fetching reports:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/reports — create a new report and queue it
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { propertyId, dateRangeStart, dateRangeEnd, compareRangeStart, compareRangeEnd } = body;

    if (!propertyId || !dateRangeStart || !dateRangeEnd || !compareRangeStart || !compareRangeEnd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (rangeDaysInclusive(dateRangeStart, dateRangeEnd) < 7) {
      return NextResponse.json({ error: 'Report range must be at least 7 days' }, { status: 400 });
    }
    if (rangeDaysInclusive(compareRangeStart, compareRangeEnd) < 7) {
      return NextResponse.json({ error: 'Compare range must be at least 7 days' }, { status: 400 });
    }

    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    if (userTeams.length === 0) {
      return NextResponse.json({ error: 'No team found' }, { status: 400 });
    }
    const teamId = userTeams[0].teamId;

    // Verify the property belongs to the user's team
    const property = await db.query.properties.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, propertyId), eq(p.teamId, teamId)),
    });
    if (!property) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

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
        propertyId,
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
          ? await db.query.account.findFirst({
              where: (a, { and, eq }) =>
                and(eq(a.userId, teamOwner.userId), eq(a.providerId, 'google')),
            })
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
        return NextResponse.json({ error: message }, { status: 500 });
      }

      // Fire-and-forget: trigger async processing via internal route
      const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/reports/${reportId}/process`, { method: 'POST' }).catch(() => {});
    }

    db.insert(systemLogs).values({
      id: `log_${nanoid(12)}`,
      action: 'report_create',
      triggeredBy: session.user.id,
      targetUserId: session.user.id,
      status: 'success',
      details: {
        reportId,
        propertyId,
        teamId,
        scheduled: shouldSchedule,
        metricsPreflight: !shouldSchedule,
      },
    }).catch(() => {});

    return NextResponse.json({ report: newReport, ga4Missing: shouldSchedule }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating report:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

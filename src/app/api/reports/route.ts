import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { reports, teamMembers, properties } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';
import { isEnabled } from '@/lib/feature-flags';

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
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
      // Fire-and-forget: trigger async processing via internal route
      const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/reports/${reportId}/process`, { method: 'POST' }).catch(() => {});
    }

    return NextResponse.json({ report: newReport, ga4Missing: shouldSchedule }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

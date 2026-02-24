import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { properties, reports, systemLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';

// PATCH /api/properties/[id]/link-ga4
// Body: { ga4PropertyId: string } — numeric ID like "123456789"
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: gscPropertyId } = await params;
    const body = await req.json();
    const { ga4PropertyId } = body;

    if (!ga4PropertyId) {
      return NextResponse.json({ error: 'ga4PropertyId is required' }, { status: 400 });
    }

    // Get user's team
    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    if (userTeams.length === 0) {
      return NextResponse.json({ error: 'No team found' }, { status: 400 });
    }
    const teamId = userTeams[0].teamId;

    // Verify the GSC property belongs to this team and is type 'gsc'
    const gscProp = await db.query.properties.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.id, gscPropertyId), eq(p.teamId, teamId), eq(p.type, 'gsc')),
    });
    if (!gscProp) {
      return NextResponse.json({ error: 'GSC property not found or unauthorized' }, { status: 404 });
    }

    // Verify the GA4 property exists on the same team
    const ga4DbId = `ga4_${ga4PropertyId}`;
    const ga4Prop = await db.query.properties.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.id, ga4DbId), eq(p.teamId, teamId), eq(p.type, 'ga4')),
    });
    if (!ga4Prop) {
      return NextResponse.json({ error: 'GA4 property not found or unauthorized' }, { status: 404 });
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

    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    for (const report of scheduledReports) {
      await db.update(reports).set({ status: 'queued' }).where(eq(reports.id, report.id));
      // Fire-and-forget processing
      fetch(`${baseUrl}/api/reports/${report.id}/process`, { method: 'POST' }).catch(() => {});
    }

    db.insert(systemLogs).values({
      id: `log_${nanoid(12)}`,
      action: 'property_link_ga4',
      triggeredBy: session.user.id,
      targetUserId: session.user.id,
      status: 'success',
      details: { gscPropertyId, ga4PropertyId, scheduledReportsStarted: scheduledReports.length },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      scheduledReportsStarted: scheduledReports.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error linking GA4:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

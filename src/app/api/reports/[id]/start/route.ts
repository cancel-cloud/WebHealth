import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

// POST /api/reports/[id]/start — promote a scheduled report to queued and fire processing
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: reportId } = await params;

    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    if (userTeams.length === 0) {
      return NextResponse.json({ error: 'No team found' }, { status: 400 });
    }
    const teamId = userTeams[0].teamId;

    const report = await db.query.reports.findFirst({
      where: (r, { and, eq }) => and(eq(r.id, reportId), eq(r.teamId, teamId)),
    });
    if (!report) {
      return NextResponse.json({ error: 'Report not found or unauthorized' }, { status: 404 });
    }
    if (report.status !== 'scheduled') {
      return NextResponse.json({ error: 'Report is not in scheduled status' }, { status: 400 });
    }

    // Verify the property now has a GA4 link
    const property = await db.query.properties.findFirst({
      where: (p, { eq }) => eq(p.id, report.propertyId),
    });
    if (!property?.ga4PropertyId) {
      return NextResponse.json({ error: 'Property still has no GA4 link' }, { status: 400 });
    }

    await db.update(reports).set({ status: 'queued' }).where(eq(reports.id, reportId));

    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/reports/${reportId}/process`, { method: 'POST' }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error starting report:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { headers } from 'next/headers';

// GET /api/reports/[id] — fetch a single report for status polling
export async function GET(
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

    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

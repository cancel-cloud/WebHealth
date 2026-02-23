import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { teamMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

// GET /api/properties — fetch properties for the current user's team
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    if (userTeams.length === 0) return NextResponse.json({ properties: [] });

    const teamId = userTeams[0].teamId;
    const teamProperties = await db.query.properties.findMany({
      where: (p, { eq }) => eq(p.teamId, teamId),
    });

    return NextResponse.json({ properties: teamProperties });
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

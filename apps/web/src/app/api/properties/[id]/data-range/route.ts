import { NextResponse } from 'next/server';
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { gscDailyFacts } from "@webhealth/shared/db/schema";
import { eq, and, min, max } from 'drizzle-orm';
import { headers } from 'next/headers';

// GET /api/properties/[id]/data-range
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: propertyId } = await params;

    // Verify property belongs to the user's team
    const userTeams = await db.query.teamMembers.findMany({
      where: (tm, { eq }) => eq(tm.userId, session.user.id),
    });
    if (userTeams.length === 0) {
      return NextResponse.json({ error: 'No team found' }, { status: 400 });
    }
    const teamId = userTeams[0].teamId;

    const prop = await db.query.properties.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, propertyId), eq(p.teamId, teamId)),
    });
    if (!prop) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

    const [result] = await db
      .select({
        earliest: min(gscDailyFacts.sourceDate),
        latest: max(gscDailyFacts.sourceDate),
      })
      .from(gscDailyFacts)
      .where(and(eq(gscDailyFacts.propertyId, propertyId), eq(gscDailyFacts.teamId, teamId)));

    return NextResponse.json({
      earliest: prop.gscDataStartDate ?? result?.earliest ?? null,
      latest: result?.latest ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error fetching data range:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

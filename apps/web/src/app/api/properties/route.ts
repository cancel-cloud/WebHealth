import { NextResponse } from 'next/server';
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { teamMembers } from "@webhealth/shared/db/schema";
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { buildCombinedReportableProperties } from "@webhealth/shared/lib/properties/reportable-properties";

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

    const reportableProperties = buildCombinedReportableProperties(teamProperties).map((p) => ({
      id: p.id,
      teamId: p.teamId,
      label: p.label,
      gscPropertyId: p.gscPropertyId,
      gscName: p.gscName,
      gscUrl: p.gscUrl,
      ga4PropertyId: p.ga4PropertyId,
      ga4DbId: p.ga4DbId,
      ga4Name: p.ga4Name,
      isLinked: p.isLinked,
    }));

    return NextResponse.json({ properties: teamProperties, reportableProperties });
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

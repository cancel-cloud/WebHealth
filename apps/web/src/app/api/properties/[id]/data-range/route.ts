import { NextResponse } from 'next/server';
import { db } from "@webhealth/shared/db";
import { gscDailyFacts } from "@webhealth/shared/db/schema";
import { eq, and, min, max } from 'drizzle-orm';
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { requireAnyTeamMembership, requireUnrestrictedSession } from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";

// GET /api/properties/[id]/data-range
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUnrestrictedSession();

    const { id } = await params;
    const propertyId = decodeRouteParam(id);

    const userTeams = await requireAnyTeamMembership(session);
    if (userTeams.length === 0) {
      throw badRequest("TEAM_NOT_FOUND", "No team found");
    }
    const teamId = userTeams[0].teamId;

    const prop = await db.query.properties.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, propertyId), eq(p.teamId, teamId)),
    });
    if (!prop) {
      throw notFound("Property not found or unauthorized", "PROPERTY_NOT_FOUND");
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
    return handleRouteError("Error fetching data range", error);
  }
}

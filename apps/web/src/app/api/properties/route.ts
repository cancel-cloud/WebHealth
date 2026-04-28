import { NextResponse } from 'next/server';
import { db } from "@webhealth/shared/db";
import { buildCombinedReportableProperties } from "@webhealth/shared/lib/properties/reportable-properties";
import { requireAnyTeamMembership, requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

// GET /api/properties — fetch properties for the current user's team
export async function GET() {
  try {
    const session = await requireUnrestrictedSession();

    const userTeams = await requireAnyTeamMembership(session);
    if (userTeams.length === 0) return NextResponse.json({ properties: [] });

    const teamId = userTeams[0].teamId;
    const teamProperties = await db.query.properties.findMany({
      where: (p, { eq }) => eq(p.teamId, teamId),
    });
    const activePropertyIds = new Set(teamProperties.filter((property) => property.active).map((property) => property.id));

    const reportableProperties = buildCombinedReportableProperties(teamProperties)
      .filter((p) => p.gscPropertyId !== null)
      .map((p) => ({
        id: p.id,
        teamId: p.teamId,
        label: p.label,
        gscPropertyId: p.gscPropertyId!,
        gscName: p.gscName!,
        gscUrl: p.gscUrl!,
        ga4PropertyId: p.ga4PropertyId,
        ga4DbId: p.ga4DbId,
        ga4Name: p.ga4Name,
        isLinked: p.isLinked,
        sourceCoverage: p.sourceCoverage,
        active: p.active,
      }));

    return NextResponse.json({
      properties: teamProperties,
      reportableProperties,
      activePropertiesCount: activePropertyIds.size,
    });
  } catch (error) {
    return handleRouteError("Error fetching properties", error);
  }
}

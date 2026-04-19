import { NextResponse } from 'next/server';
import { db } from "@webhealth/shared/db";
import { getWeeklyReviewLimit } from "@webhealth/shared/lib/weekly-review";
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
    const team = await db.query.teams.findFirst({
      where: (t, { eq }) => eq(t.id, teamId),
      columns: { tier: true },
    });
    const weeklyReviews = await db.query.propertyWeeklyReviews.findMany({
      where: (p, { and, eq }) => and(eq(p.teamId, teamId), eq(p.enabled, true)),
      columns: { propertyId: true },
    });
    const watchedPropertyIds = new Set(weeklyReviews.map((review) => review.propertyId));
    const weeklyReviewLimit = getWeeklyReviewLimit(team?.tier ?? "free");
    const weeklyReviewWatchedCount = watchedPropertyIds.size;
    const propertiesWithWeeklyReviews = teamProperties.map((property) => ({
      ...property,
      weeklyReviewEnabled: watchedPropertyIds.has(property.id),
      weeklyReviewLimit,
      weeklyReviewWatchedCount,
    }));

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

    return NextResponse.json({
      properties: propertiesWithWeeklyReviews,
      reportableProperties,
      weeklyReview: {
        limit: weeklyReviewLimit,
        watchedCount: weeklyReviewWatchedCount,
      },
    });
  } catch (error) {
    return handleRouteError("Error fetching properties", error);
  }
}

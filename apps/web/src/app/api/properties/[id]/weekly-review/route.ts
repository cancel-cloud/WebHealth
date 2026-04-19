import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import { propertyWeeklyReviews } from "@webhealth/shared/db/schema";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import { getWeeklyReviewLimit } from "@webhealth/shared/lib/weekly-review";
import { requireTeamOwner, requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const ownerMembership = await requireTeamOwner(session);
    const { id: propertyId } = await params;
    const body = await req.json();
    const enabled = Boolean(body.enabled);
    const teamId = ownerMembership.teamId;

    const property = await db.query.properties.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.id, propertyId), eq(p.teamId, teamId), eq(p.type, "gsc")),
      columns: { id: true, name: true },
    });
    if (!property) {
      throw notFound("GSC property not found or unauthorized", "GSC_PROPERTY_NOT_FOUND");
    }

    const team = await db.query.teams.findFirst({
      where: (t, { eq }) => eq(t.id, teamId),
      columns: { tier: true },
    });
    const limit = getWeeklyReviewLimit(team?.tier ?? "free");

    const activeReviews = await db.query.propertyWeeklyReviews.findMany({
      where: (review, { and, eq }) => and(eq(review.teamId, teamId), eq(review.enabled, true)),
      columns: { propertyId: true },
    });
    const isAlreadyEnabled = activeReviews.some((review) => review.propertyId === propertyId);
    if (enabled && !isAlreadyEnabled && activeReviews.length >= limit) {
      throw badRequest(
        "WEEKLY_REVIEW_LIMIT_EXCEEDED",
        `Your plan can watch ${limit} ${limit === 1 ? "property" : "properties"} for weekly reviews.`,
      );
    }

    const existing = await db.query.propertyWeeklyReviews.findFirst({
      where: (review, { and, eq }) =>
        and(eq(review.teamId, teamId), eq(review.propertyId, propertyId)),
    });

    if (existing) {
      await db
        .update(propertyWeeklyReviews)
        .set({ enabled, updatedAt: new Date() })
        .where(eq(propertyWeeklyReviews.id, existing.id));
    } else {
      await db.insert(propertyWeeklyReviews).values({
        id: `pwr_${nanoid(12)}`,
        teamId,
        propertyId,
        enabled,
        createdByUserId: session.user.id,
      });
    }

    void recordProductEvent({
      teamId,
      userId: session.user.id,
      name: enabled ? "weekly_watch_enabled" : "weekly_watch_disabled",
      source: "properties",
      entityType: "property",
      entityId: propertyId,
      properties: { propertyId, propertyName: property.name },
    }).catch(() => {});

    const watchedCount = activeReviews.length + (enabled && !isAlreadyEnabled ? 1 : 0) - (!enabled && isAlreadyEnabled ? 1 : 0);

    return NextResponse.json({
      success: true,
      weeklyReviewEnabled: enabled,
      weeklyReviewLimit: limit,
      weeklyReviewWatchedCount: Math.max(0, watchedCount),
    });
  } catch (error) {
    return handleRouteError("Error updating weekly review watch", error);
  }
}

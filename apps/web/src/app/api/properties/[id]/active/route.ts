import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { properties, propertyWeeklyReviews } from "@webhealth/shared/db/schema";
import { notFound } from "@webhealth/shared/lib/http-errors";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import { requireTeamOwner, requireUnrestrictedSession } from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";
import { buildPropertyActiveUpdate } from "./route.logic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const ownerMembership = await requireTeamOwner(session);
    const { id } = await params;
    const propertyId = decodeRouteParam(id);
    const body = await req.json() as { active?: unknown };
    const enabled = Boolean(body.active);
    const teamId = ownerMembership.teamId;

    const property = await db.query.properties.findFirst({
      where: (p, { and: andFn, eq: eqFn }) =>
        andFn(eqFn(p.id, propertyId), eqFn(p.teamId, teamId)),
      columns: { id: true, name: true, active: true },
    });
    if (!property) {
      throw notFound("Property not found or unauthorized", "PROPERTY_NOT_FOUND");
    }

    const [activeRows, weeklyReview] = await Promise.all([
      db.query.properties.findMany({
        where: (p, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(p.teamId, teamId), eqFn(p.active, true)),
        columns: { id: true },
      }),
      db.query.propertyWeeklyReviews.findFirst({
        where: (review, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(review.teamId, teamId), eqFn(review.propertyId, propertyId)),
        columns: { id: true, enabled: true },
      }),
    ]);

    const update = buildPropertyActiveUpdate({
      enabled,
      weeklyReviewEnabled: weeklyReview?.enabled ?? false,
      activePropertiesBefore: activeRows.length,
      propertyWasActive: property.active,
    });

    await db.transaction(async (tx) => {
      await tx
        .update(properties)
        .set({ active: update.nextActive })
        .where(and(eq(properties.id, propertyId), eq(properties.teamId, teamId)));

      if (update.shouldDisableWeeklyReview && weeklyReview) {
        await tx
          .update(propertyWeeklyReviews)
          .set({ enabled: false, updatedAt: new Date() })
          .where(eq(propertyWeeklyReviews.id, weeklyReview.id));
      }
    });

    void recordProductEvent({
      teamId,
      userId: session.user.id,
      name: enabled ? "property_activated" : "property_deactivated",
      source: "dashboard",
      entityType: "property",
      entityId: propertyId,
      properties: {
        propertyId,
        propertyName: property.name,
        activePropertiesAfter: update.activePropertiesAfter,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      active: update.nextActive,
      activePropertiesCount: update.activePropertiesAfter,
      weeklyReviewDisabled: update.shouldDisableWeeklyReview,
    });
  } catch (error) {
    return handleRouteError("Error updating property active state", error);
  }
}

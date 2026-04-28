import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { properties } from "@webhealth/shared/db/schema";
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
    const body = await req.json() as { active?: unknown; propertyIds?: unknown };
    const enabled = Boolean(body.active);
    const teamId = ownerMembership.teamId;
    const requestedPropertyIds = Array.isArray(body.propertyIds)
      ? body.propertyIds.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
    const propertyIds = [...new Set([propertyId, ...requestedPropertyIds])];

    const targetProperties = await db.query.properties.findMany({
      where: (p, { and: andFn, eq: eqFn, inArray: inArrayFn }) =>
        andFn(eqFn(p.teamId, teamId), inArrayFn(p.id, propertyIds)),
      columns: { id: true, name: true, active: true },
    });
    if (targetProperties.length !== propertyIds.length) {
      throw notFound("Property not found or unauthorized", "PROPERTY_NOT_FOUND");
    }
    const property = targetProperties.find((item) => item.id === propertyId) ?? targetProperties[0];

    const activeRows = await db.query.properties.findMany({
      where: (p, { and: andFn, eq: eqFn }) =>
        andFn(eqFn(p.teamId, teamId), eqFn(p.active, true)),
      columns: { id: true },
    });

    const update = buildPropertyActiveUpdate({
      enabled,
      activePropertiesBefore: activeRows.length,
      propertyWasActive: property.active,
    });
    const activePropertiesAfter = activeRows.length + targetProperties.reduce((delta, target) => {
      if (target.active === update.nextActive) return delta;
      return delta + (update.nextActive ? 1 : -1);
    }, 0);

    await db
      .update(properties)
      .set({ active: update.nextActive })
      .where(and(inArray(properties.id, propertyIds), eq(properties.teamId, teamId)));

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
        activePropertiesAfter,
        propertyIds,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      active: update.nextActive,
      activePropertiesCount: activePropertiesAfter,
    });
  } catch (error) {
    return handleRouteError("Error updating property active state", error);
  }
}

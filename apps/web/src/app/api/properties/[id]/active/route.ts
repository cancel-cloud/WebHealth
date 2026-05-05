import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { planSettings, properties, teams } from "@webhealth/shared/db/schema";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { recordProductEvent } from "@webhealth/shared/lib/product-event-store";
import { requireTeamOwner, requireUnrestrictedSession } from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";
import { buildPropertyActiveGroupPlan } from "./route.logic";

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
      columns: { id: true, name: true, type: true, active: true, ga4PropertyId: true },
    });
    if (targetProperties.length !== propertyIds.length) {
      throw notFound("Property not found or unauthorized", "PROPERTY_NOT_FOUND");
    }
    const property = targetProperties.find((item) => item.id === propertyId) ?? targetProperties[0];

    const [team, allTeamProperties] = await Promise.all([
      db.query.teams.findFirst({
        where: eq(teams.id, teamId),
        columns: { tier: true },
      }),
      db.query.properties.findMany({
        where: (p, { eq: eqFn }) => eqFn(p.teamId, teamId),
        columns: { id: true, type: true, active: true, ga4PropertyId: true },
      }),
    ]);
    const planSetting = team
      ? await db.query.planSettings.findFirst({
          where: eq(planSettings.tier, team.tier),
          columns: { maxProperties: true },
        })
      : null;

    let update;
    try {
      update = buildPropertyActiveGroupPlan({
        enabled,
        propertyId,
        requestedProperties: targetProperties,
        allTeamProperties,
        maxActiveProperties: planSetting?.maxProperties ?? null,
      });
    } catch (error) {
      throw badRequest(
        "PROPERTY_ACTIVATION_INVALID",
        error instanceof Error ? error.message : "Property activation is invalid.",
      );
    }

    if (update.activateIds.length) {
      await db
        .update(properties)
        .set({ active: true })
        .where(and(inArray(properties.id, update.activateIds), eq(properties.teamId, teamId)));
    }

    if (update.deactivateIds.length) {
      await db
        .update(properties)
        .set({ active: false })
        .where(and(inArray(properties.id, update.deactivateIds), eq(properties.teamId, teamId)));
    }

    if (!update.activateIds.length && !update.deactivateIds.length) {
      await db
        .update(properties)
        .set({ active: update.nextActive })
        .where(and(inArray(properties.id, propertyIds), eq(properties.teamId, teamId)));
    }

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
        propertyIds,
        activateIds: update.activateIds,
        deactivateIds: update.deactivateIds,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      active: update.nextActive,
      activePropertiesCount: update.activePropertiesAfter,
    });
  } catch (error) {
    return handleRouteError("Error updating property active state", error);
  }
}

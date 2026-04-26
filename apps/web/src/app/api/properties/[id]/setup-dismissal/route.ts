import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import { propertySetupDismissals } from "@webhealth/shared/db/schema";
import { notFound } from "@webhealth/shared/lib/http-errors";
import {
  requirePrimaryTeamMembership,
  requireUnrestrictedSession,
} from "@/lib/server/authz";
import { decodeRouteParam } from "@/lib/server/route-params";
import { handleRouteError } from "@/lib/server/route-security";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUnrestrictedSession();
    const membership = await requirePrimaryTeamMembership(session);
    const { id } = await params;
    const propertyId = decodeRouteParam(id);
    const property = await db.query.properties.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.id, propertyId), eq(p.teamId, membership.teamId), eq(p.active, true)),
      columns: { id: true },
    });
    if (!property) {
      throw notFound("Property not found or unauthorized", "PROPERTY_NOT_FOUND");
    }

    await db
      .insert(propertySetupDismissals)
      .values({
        id: `psd_${nanoid(12)}`,
        teamId: membership.teamId,
        userId: session.user.id,
        propertyId,
        dismissedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [propertySetupDismissals.userId, propertySetupDismissals.propertyId],
        set: { dismissedAt: new Date() },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("Error dismissing property setup notice", error);
  }
}

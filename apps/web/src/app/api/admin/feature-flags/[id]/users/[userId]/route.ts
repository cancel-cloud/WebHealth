import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { userFeatureFlags } from "@webhealth/shared/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    await requireAdminSession();

    const { id: flagId, userId } = await params;
    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      throw badRequest("INVALID_ENABLED", "enabled must be a boolean");
    }

    const existing = await db.query.userFeatureFlags.findFirst({
      where: (uff, { and, eq }) => and(eq(uff.flagId, flagId), eq(uff.userId, userId)),
    });

    let override;
    if (existing) {
      [override] = await db
        .update(userFeatureFlags)
        .set({ enabled })
        .where(and(eq(userFeatureFlags.flagId, flagId), eq(userFeatureFlags.userId, userId)))
        .returning();
    } else {
      [override] = await db
        .insert(userFeatureFlags)
        .values({ id: `uff_${nanoid(12)}`, flagId, userId, enabled })
        .returning();
    }

    return NextResponse.json({ override });
  } catch (error: unknown) {
    return handleRouteError("Error upserting user feature flag", error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    await requireAdminSession();

    const { id: flagId, userId } = await params;

    await db
      .delete(userFeatureFlags)
      .where(and(eq(userFeatureFlags.flagId, flagId), eq(userFeatureFlags.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError("Error deleting user feature flag", error);
  }
}

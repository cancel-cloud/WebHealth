import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { user, teams, systemLogs } from "@webhealth/shared/db/schema";
import { eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await requireAdminSession();

    const { userId } = await params;
    const body = await req.json() as Record<string, unknown>;

    if ("tier" in body && typeof body.tier === "string") {
      await db.update(teams).set({ tier: body.tier }).where(eq(teams.ownerId, userId));
    }

    if ("isRestricted" in body || "restrictionMessage" in body) {
      const update: { isRestricted?: boolean; restrictionMessage?: string | null } = {};
      if ("isRestricted" in body && typeof body.isRestricted === "boolean") {
        update.isRestricted = body.isRestricted;
      }
      if ("restrictionMessage" in body) {
        update.restrictionMessage =
          typeof body.restrictionMessage === "string" ? body.restrictionMessage : null;
      }
      await db.update(user).set(update).where(eq(user.id, userId));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError("Error updating user", error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await requireAdminSession();

    const { userId } = await params;

    // Clear log references to avoid FK constraint violations on delete
    await db
      .delete(systemLogs)
      .where(
        or(eq(systemLogs.triggeredBy, userId), eq(systemLogs.targetUserId, userId)),
      );

    // Delete team (cascades teamMembers, properties, reports)
    await db.delete(teams).where(eq(teams.ownerId, userId));

    // Delete user (cascades session, account)
    await db.delete(user).where(eq(user.id, userId));

    // Log after deletion (targetUserId is null since user is gone)
    db.insert(systemLogs)
      .values({
        id: `log_${nanoid(12)}`,
        action: "user_deleted",
        triggeredBy: session.user.id,
        targetUserId: null,
        status: "success",
        details: { deletedUserId: userId },
      })
      .catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError("Error deleting user", error);
  }
}

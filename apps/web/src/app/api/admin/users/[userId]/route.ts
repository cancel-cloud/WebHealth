import { NextResponse } from "next/server";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { user, teams, systemLogs } from "@webhealth/shared/db/schema";
import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error updating user:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { userFeatureFlags } from "@webhealth/shared/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: flagId, userId } = await params;
    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error upserting user feature flag:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: flagId, userId } = await params;

    await db
      .delete(userFeatureFlags)
      .where(and(eq(userFeatureFlags.flagId, flagId), eq(userFeatureFlags.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error deleting user feature flag:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

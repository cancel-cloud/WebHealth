import { NextResponse } from "next/server";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { userFeatureFlags, user } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id: flagId } = await params;

    const overrides = await db
      .select({
        id: userFeatureFlags.id,
        userId: userFeatureFlags.userId,
        enabled: userFeatureFlags.enabled,
        userName: user.name,
        userEmail: user.email,
      })
      .from(userFeatureFlags)
      .leftJoin(user, eq(user.id, userFeatureFlags.userId))
      .where(eq(userFeatureFlags.flagId, flagId));

    return NextResponse.json({ overrides });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching flag overrides:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

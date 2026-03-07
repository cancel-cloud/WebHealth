import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { userFeatureFlags, user } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();

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
    return handleRouteError("Error fetching flag overrides", error);
  }
}

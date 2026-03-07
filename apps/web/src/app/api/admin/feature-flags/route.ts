import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { featureFlags, userFeatureFlags } from "@webhealth/shared/db/schema";
import { eq, count } from "drizzle-orm";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET() {
  try {
    await requireAdminSession();

    const flags = await db
      .select({
        id: featureFlags.id,
        name: featureFlags.name,
        description: featureFlags.description,
        enabledGlobally: featureFlags.enabledGlobally,
        createdAt: featureFlags.createdAt,
        updatedAt: featureFlags.updatedAt,
        overrideCount: count(userFeatureFlags.id),
      })
      .from(featureFlags)
      .leftJoin(userFeatureFlags, eq(userFeatureFlags.flagId, featureFlags.id))
      .groupBy(featureFlags.id)
      .orderBy(featureFlags.name);

    return NextResponse.json({ flags });
  } catch (error: unknown) {
    return handleRouteError("Error fetching feature flags", error);
  }
}

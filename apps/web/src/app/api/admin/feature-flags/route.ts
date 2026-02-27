import { NextResponse } from "next/server";
import { auth } from "@webhealth/shared/lib/auth";
import { db } from "@webhealth/shared/db";
import { featureFlags, userFeatureFlags } from "@webhealth/shared/db/schema";
import { eq, count } from "drizzle-orm";
import { headers } from "next/headers";

const ADMIN_EMAIL = "lukas@devbrew.dev";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.email !== ADMIN_EMAIL)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error fetching feature flags:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

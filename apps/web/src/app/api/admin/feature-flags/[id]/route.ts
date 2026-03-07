import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { featureFlags } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession();

    const { id } = await params;
    const body = await req.json();
    const { enabledGlobally } = body;

    if (typeof enabledGlobally !== "boolean") {
      throw badRequest("INVALID_ENABLED_GLOBALLY", "enabledGlobally must be a boolean");
    }

    const [updated] = await db
      .update(featureFlags)
      .set({ enabledGlobally, updatedAt: new Date() })
      .where(eq(featureFlags.id, id))
      .returning();

    if (!updated) {
      throw notFound("Flag not found", "FEATURE_FLAG_NOT_FOUND");
    }

    return NextResponse.json({ flag: updated });
  } catch (error: unknown) {
    return handleRouteError("Error updating feature flag", error);
  }
}

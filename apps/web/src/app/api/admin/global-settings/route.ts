import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { planSettings } from "@webhealth/shared/db/schema";
import { ensurePlanSettingsSeeded } from "@webhealth/shared/db/plan-settings-defaults";
import { eq, asc } from "drizzle-orm";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function GET() {
  try {
    await requireAdminSession();

    await ensurePlanSettingsSeeded(db);

    const settings = await db
      .select()
      .from(planSettings)
      .orderBy(asc(planSettings.tier));

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    return handleRouteError("Error fetching global settings", error);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdminSession();

    await ensurePlanSettingsSeeded(db);

    const body = await req.json() as {
      tier: string;
      reportsPerMonth: number | null;
      maxProperties: number | null;
      detailsPerMonth: number | null;
    };

    if (!body.tier) {
      throw badRequest("TIER_REQUIRED", "tier is required");
    }

    await db
      .update(planSettings)
      .set({
        reportsPerMonth: body.reportsPerMonth ?? null,
        maxProperties: body.maxProperties ?? null,
        detailsPerMonth: body.detailsPerMonth ?? null,
        updatedAt: new Date(),
      })
      .where(eq(planSettings.tier, body.tier));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError("Error updating global settings", error);
  }
}

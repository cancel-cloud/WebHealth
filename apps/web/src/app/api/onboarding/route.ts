import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { user } from "@webhealth/shared/db/schema";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { requireUnrestrictedSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { parseOnboardingCompletionReason } from "./route.logic";

export async function PATCH(req: Request) {
  try {
    const session = await requireUnrestrictedSession();
    const body = await req.json().catch(() => null) as { reason?: unknown } | null;
    let reason;
    try {
      reason = parseOnboardingCompletionReason(body?.reason);
    } catch (error) {
      throw badRequest(
        "ONBOARDING_REASON_INVALID",
        error instanceof Error ? error.message : "Invalid onboarding completion reason.",
      );
    }

    await db
      .update(user)
      .set({
        onboardingCompletedAt: new Date(),
        onboardingCompletionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true, reason });
  } catch (error) {
    return handleRouteError("Error completing onboarding", error);
  }
}

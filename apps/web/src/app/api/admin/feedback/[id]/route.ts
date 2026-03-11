import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@webhealth/shared/db";
import { feedbackSubmissions } from "@webhealth/shared/db/schema";
import { badRequest, notFound } from "@webhealth/shared/lib/http-errors";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { parseFeedbackStatusPatch } from "../route.logic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminSession();
    const body = await req.json();
    const parsed = parseFeedbackStatusPatch(body);

    if (!parsed) {
      throw badRequest("INVALID_STATUS", "Unsupported feedback status");
    }

    const { id } = await params;
    const nextStatus = parsed.status;
    const [updated] = await db
      .update(feedbackSubmissions)
      .set({
        status: nextStatus,
        resolvedAt: nextStatus === "resolved" ? new Date() : null,
        resolvedByUserId: nextStatus === "resolved" ? session.user.id : null,
        updatedAt: new Date(),
      })
      .where(eq(feedbackSubmissions.id, id))
      .returning({ id: feedbackSubmissions.id, status: feedbackSubmissions.status });

    if (!updated) {
      throw notFound("Feedback submission not found", "FEEDBACK_NOT_FOUND");
    }

    return NextResponse.json({ submission: updated });
  } catch (error: unknown) {
    return handleRouteError("PATCH /api/admin/feedback/[id] error", error);
  }
}

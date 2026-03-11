import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@webhealth/shared/db";
import { feedbackSubmissions } from "@webhealth/shared/db/schema";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { requireSession, getUserTeamMemberships } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { parseCreateFeedbackRequest } from "./route.logic";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = parseCreateFeedbackRequest(body);

    if (!parsed.ok) {
      throw badRequest(parsed.error, "Please choose a type and enter a message before submitting.");
    }

    const memberships = await getUserTeamMemberships(session.user.id);
    const teamId = memberships[0]?.teamId ?? null;

    const [submission] = await db
      .insert(feedbackSubmissions)
      .values({
        id: nanoid(),
        teamId,
        userId: session.user.id,
        userNameSnapshot: session.user.name,
        emailSnapshot: session.user.email ?? "",
        type: parsed.value.type,
        source: parsed.value.source,
        message: parsed.value.message,
      })
      .returning({ id: feedbackSubmissions.id });

    return NextResponse.json({ submission });
  } catch (error: unknown) {
    return handleRouteError("POST /api/feedback error", error);
  }
}

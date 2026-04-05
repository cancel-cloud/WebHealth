import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { getGoogleAccessHealthForUser } from "@/lib/server/google-access";

export async function GET() {
  try {
    const session = await requireSession();
    const health = await getGoogleAccessHealthForUser(session.user.id);

    return NextResponse.json({ health });
  } catch (error) {
    return handleRouteError("Error fetching Google access health", error);
  }
}

import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { user } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@webhealth/shared/lib/auth";
import { getStripe } from "@/lib/server/stripe";
import { requireSession, getUserTeamMemberships } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function DELETE() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const memberships = await getUserTeamMemberships(userId);
    if (memberships.length > 0) {
      const teamId = memberships[0].teamId;
      const team = await db.query.teams.findFirst({
        where: (t, { eq }) => eq(t.id, teamId),
        columns: { stripeSubscriptionId: true },
      });
      if (team?.stripeSubscriptionId) {
        try {
          await getStripe().subscriptions.cancel(team.stripeSubscriptionId);
        } catch {
          // Non-fatal — proceed with deletion even if Stripe cancel fails
        }
      }
    }

    await db.delete(user).where(eq(user.id, userId));

    await auth.api.signOut({ headers: await headers() });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("Error deleting account", error);
  }
}

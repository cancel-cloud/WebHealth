import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import {
  metricsBackfillJobs,
  systemLogs,
  teams,
  user,
  userFeatureFlags,
} from "@webhealth/shared/db/schema";
import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@webhealth/shared/lib/auth";
import { getStripe } from "@/lib/server/stripe";
import { requireSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { deleteUserAccount } from "./route.logic";

export async function DELETE() {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    await deleteUserAccount(userId, {
      listOwnedTeams: async (ownerId) =>
        db.query.teams.findMany({
          where: (table, { eq }) => eq(table.ownerId, ownerId),
          columns: { id: true, stripeSubscriptionId: true },
        }),
      cancelStripeSubscription: async (subscriptionId) => {
        await getStripe().subscriptions.cancel(subscriptionId);
      },
      deleteSystemLogsForUser: async (targetUserId) => {
        await db
          .delete(systemLogs)
          .where(
            or(
              eq(systemLogs.triggeredBy, targetUserId),
              eq(systemLogs.targetUserId, targetUserId),
            ),
          );
      },
      deleteUserFeatureFlagsForUser: async (targetUserId) => {
        await db
          .delete(userFeatureFlags)
          .where(eq(userFeatureFlags.userId, targetUserId));
      },
      deleteMetricsBackfillJobsForUser: async (targetUserId) => {
        await db
          .delete(metricsBackfillJobs)
          .where(
            or(
              eq(metricsBackfillJobs.triggeredByUserId, targetUserId),
              eq(metricsBackfillJobs.targetUserId, targetUserId),
            ),
          );
      },
      deleteOwnedTeams: async (ownerId) => {
        await db.delete(teams).where(eq(teams.ownerId, ownerId));
      },
      deleteUser: async (targetUserId) => {
        await db.delete(user).where(eq(user.id, targetUserId));
      },
    });

    await auth.api.signOut({ headers: await headers() });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("Error deleting account", error);
  }
}

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
import { nanoid } from "nanoid";
import { requireAdminSession } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { getStripe } from "@/lib/server/stripe";
import { cleanupAfterTierChange } from "@webhealth/shared/lib/tier-change-cleanup";
import { isPublishedPlanTier } from "@webhealth/shared/db/plan-settings-defaults";
import { badRequest } from "@webhealth/shared/lib/http-errors";
import { deleteUserAccount } from "../../../account/route.logic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdminSession();

    const { userId } = await params;
    const body = await req.json() as Record<string, unknown>;

    if ("tier" in body && typeof body.tier === "string") {
      if (!isPublishedPlanTier(body.tier)) {
        throw badRequest("TIER_INVALID", "tier is not a published plan");
      }

      const team = await db.query.teams.findFirst({
        where: (t, { eq }) => eq(t.ownerId, userId),
        columns: { id: true, tier: true },
      });
      const oldTier = team?.tier ?? "free";
      await db.update(teams).set({ tier: body.tier }).where(eq(teams.ownerId, userId));

      if (team && body.tier !== oldTier) {
        await cleanupAfterTierChange({ teamId: team.id, oldTier, newTier: body.tier });
      }
    }

    if ("isRestricted" in body || "restrictionMessage" in body) {
      const update: { isRestricted?: boolean; restrictionMessage?: string | null } = {};
      if ("isRestricted" in body && typeof body.isRestricted === "boolean") {
        update.isRestricted = body.isRestricted;
      }
      if ("restrictionMessage" in body) {
        update.restrictionMessage =
          typeof body.restrictionMessage === "string" ? body.restrictionMessage : null;
      }
      await db.update(user).set(update).where(eq(user.id, userId));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError("Error updating user", error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await requireAdminSession();

    const { userId } = await params;

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

    // Log after deletion (targetUserId is null since user is gone)
    db.insert(systemLogs)
      .values({
        id: `log_${nanoid(12)}`,
        action: "user_deleted",
        triggeredBy: session.user.id,
        targetUserId: null,
        status: "success",
        details: { deletedUserId: userId },
      })
      .catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return handleRouteError("Error deleting user", error);
  }
}

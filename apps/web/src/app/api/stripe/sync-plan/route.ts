import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { teams } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, tierFromPriceId } from "@/lib/server/stripe";
import { requireSession, requireTeamOwner } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { cleanupAfterTierChange } from "@webhealth/shared/lib/tier-change-cleanup";

/**
 * POST /api/stripe/sync-plan
 *
 * Called immediately after a Stripe checkout success redirect.
 * Queries Stripe directly for the team's active subscription and
 * updates the DB — making plan activation independent of webhook delivery.
 */
export async function POST() {
  try {
    const session = await requireSession();
    const membership = await requireTeamOwner(session);
    const teamId = membership.teamId;

    const team = await db.query.teams.findFirst({
      where: (t, { eq }) => eq(t.id, teamId),
      columns: { stripeCustomerId: true, stripeSubscriptionId: true, tier: true },
    });

    if (!team?.stripeCustomerId) {
      // No Stripe customer yet — nothing to sync
      return NextResponse.json({ synced: false, reason: "no_customer" });
    }

    const stripe = getStripe();

    // Prefer looking up the known subscription; fall back to listing by customer
    let subscription: import("stripe").Stripe.Subscription | null = null;
    if (team.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(team.stripeSubscriptionId);
        if (sub.status === "active" || sub.status === "trialing") {
          subscription = sub;
        }
      } catch {
        // Subscription not found — fall through to customer listing
      }
    }

    if (!subscription) {
      const subscriptions = await stripe.subscriptions.list({
        customer: team.stripeCustomerId,
        status: "active",
        limit: 1,
      });
      subscription = subscriptions.data[0] ?? null;
    }

    if (!subscription) {
      // No active subscription — downgrade to free
      const oldTier = team.tier;
      await db.update(teams).set({
        tier: "free",
        stripeSubscriptionId: null,
        subscriptionCancelAt: null,
      }).where(eq(teams.id, teamId));

      await cleanupAfterTierChange({ teamId, oldTier, newTier: "free" });
      return NextResponse.json({ synced: true, tier: "free", reason: "no_active_subscription" });
    }

    const priceId = subscription.items.data[0]?.price.id ?? "";
    const tier = tierFromPriceId(priceId);
    const cancelAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null;

    await db.update(teams).set({
      tier,
      stripeSubscriptionId: subscription.id,
      subscriptionCancelAt: cancelAt,
    }).where(eq(teams.id, teamId));

    if (tier !== team.tier) {
      await cleanupAfterTierChange({ teamId, oldTier: team.tier, newTier: tier });
    }
    return NextResponse.json({ synced: true, tier });
  } catch (error) {
    return handleRouteError("Stripe plan sync error", error);
  }
}

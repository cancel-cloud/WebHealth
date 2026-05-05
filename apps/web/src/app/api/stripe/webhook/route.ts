import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { teams } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, tierFromPriceId } from "@/lib/server/stripe";
import { cleanupAfterTierChange } from "@webhealth/shared/lib/tier-change-cleanup";
import type Stripe from "stripe";

// Stripe requires the exact raw bytes of the body for signature verification.
// Reading as ArrayBuffer → Buffer avoids any encoding normalization Next.js
// might apply when using req.text() (e.g. \r\n → \n).
export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBuffer = await req.arrayBuffer();
  const body = Buffer.from(rawBuffer);
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const teamId = checkoutSession.metadata?.teamId;
        const plan = checkoutSession.metadata?.plan;

        if (teamId && plan && checkoutSession.customer) {
          await db
            .update(teams)
            .set({
              tier: plan,
              stripeCustomerId: checkoutSession.customer as string,
              stripeSubscriptionId: checkoutSession.subscription as string | null ?? undefined,
            })
            .where(eq(teams.id, teamId));
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const teamId = sub.metadata?.teamId;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const tier = tierFromPriceId(priceId);
        const cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : null;

        const updatePayload = { tier, stripeSubscriptionId: sub.id, subscriptionCancelAt: cancelAt };

        let oldTier = "free";
        let resolvedTeamId: string | null = null;

        if (!teamId) {
          const team = await db.query.teams.findFirst({
            where: (t, { eq }) => eq(t.stripeCustomerId, sub.customer as string),
            columns: { id: true, tier: true },
          });
          if (team) {
            oldTier = team.tier;
            resolvedTeamId = team.id;
            await db.update(teams).set(updatePayload).where(eq(teams.id, team.id));
          }
        } else {
          const team = await db.query.teams.findFirst({
            where: (t, { eq }) => eq(t.id, teamId),
            columns: { tier: true },
          });
          oldTier = team?.tier ?? "free";
          resolvedTeamId = teamId;
          await db.update(teams).set(updatePayload).where(eq(teams.id, teamId));
        }

        if (resolvedTeamId && tier !== oldTier) {
          await cleanupAfterTierChange({ teamId: resolvedTeamId, oldTier, newTier: tier });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const team = await db.query.teams.findFirst({
          where: (t, { eq }) => eq(t.stripeCustomerId, sub.customer as string),
          columns: { id: true, tier: true },
        });
        if (team) {
          const oldTier = team.tier;
          await db
            .update(teams)
            .set({ tier: "free", stripeSubscriptionId: null, subscriptionCancelAt: null })
            .where(eq(teams.id, team.id));

          await cleanupAfterTierChange({ teamId: team.id, oldTier, newTier: "free" });
        }
        break;
      }

      default:
        // Unhandled event types — safe to ignore
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for event ${event.type}:`, err);
    return NextResponse.json({ error: "Internal webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

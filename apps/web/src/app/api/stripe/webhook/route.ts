import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { teams } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, tierFromPriceId } from "@/lib/server/stripe";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
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

        if (!teamId) {
          // Look up team by Stripe customer ID
          const team = await db.query.teams.findFirst({
            where: (t, { eq }) => eq(t.stripeCustomerId, sub.customer as string),
          });
          if (team) {
            await db.update(teams).set({ tier, stripeSubscriptionId: sub.id }).where(eq(teams.id, team.id));
          }
        } else {
          await db.update(teams).set({ tier, stripeSubscriptionId: sub.id }).where(eq(teams.id, teamId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const team = await db.query.teams.findFirst({
          where: (t, { eq }) => eq(t.stripeCustomerId, sub.customer as string),
        });
        if (team) {
          await db
            .update(teams)
            .set({ tier: "free", stripeSubscriptionId: null })
            .where(eq(teams.id, team.id));
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

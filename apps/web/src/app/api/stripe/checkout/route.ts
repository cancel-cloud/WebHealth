import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { teams } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, STRIPE_PRICE_IDS, type StripePlan } from "@/lib/server/stripe";
import { requireUnrestrictedSession, requireTeamOwner } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function POST(req: Request) {
  try {
    const session = await requireUnrestrictedSession();
    const membership = await requireTeamOwner(session);
    const teamId = membership.teamId;

    const { plan } = (await req.json()) as { plan?: string };
    if (!plan || !["pro", "agency"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_IDS[plan as StripePlan];
    if (!priceId) {
      return NextResponse.json({ error: `Price ID for plan "${plan}" is not configured` }, { status: 500 });
    }

    const team = await db.query.teams.findFirst({
      where: (t, { eq }) => eq(t.id, teamId),
    });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const stripe = getStripe();

    // Ensure Stripe customer exists
    let customerId = team.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
        metadata: { teamId, userId: session.user.id },
      });
      customerId = customer.id;
      await db.update(teams).set({ stripeCustomerId: customerId }).where(eq(teams.id, teamId));
    }

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://webhealth.devbrew.dev";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?stripe=success`,
      cancel_url: `${origin}/settings?stripe=cancelled`,
      metadata: { teamId, plan },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    return handleRouteError("Stripe checkout error", error);
  }
}

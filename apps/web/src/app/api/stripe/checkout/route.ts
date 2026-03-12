import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { teams } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { getStripe, STRIPE_PRICE_IDS, type StripePlan } from "@/lib/server/stripe";
import { requireUnrestrictedSession, requireTeamOwner } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";
import { buildCheckoutSessionParams, ensureStripeCustomerId } from "./route.logic";

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

    const customerId = await ensureStripeCustomerId({
      currentCustomerId: team.stripeCustomerId,
      teamId,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      stripe,
      persistCustomerId: async (value) => {
        await db.update(teams).set({ stripeCustomerId: value }).where(eq(teams.id, teamId));
      },
    });

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://webhealth.devbrew.dev";

    const checkoutSession = await stripe.checkout.sessions.create(
      buildCheckoutSessionParams({
        customerId,
        priceId,
        origin,
        teamId,
        plan: plan as StripePlan,
      }),
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    return handleRouteError("Stripe checkout error", error);
  }
}

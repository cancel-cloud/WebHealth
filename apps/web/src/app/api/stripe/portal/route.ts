import { NextResponse } from "next/server";
import { db } from "@webhealth/shared/db";
import { teams } from "@webhealth/shared/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/server/stripe";
import { requireUnrestrictedSession, requireTeamOwner } from "@/lib/server/authz";
import { handleRouteError } from "@/lib/server/route-security";

export async function POST(req: Request) {
  try {
    const session = await requireUnrestrictedSession();
    const membership = await requireTeamOwner(session);
    const teamId = membership.teamId;

    const team = await db.query.teams.findFirst({
      where: (t, { eq }) => eq(t.id, teamId),
    });

    if (!team?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Upgrade to a paid plan first." },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://webhealth.devbrew.dev";
    const stripe = getStripe();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: team.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    return handleRouteError("Stripe portal error", error);
  }
}

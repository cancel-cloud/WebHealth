import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: "2023-10-16" as any,
    });
  }
  return _stripe;
}

export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  studio: process.env.STRIPE_STUDIO_PRICE_ID,
};

export type StripePlan = "starter" | "studio";

/** Maps Stripe price ID → internal tier name */
export function tierFromPriceId(priceId: string): string {
  for (const [tier, pid] of Object.entries(STRIPE_PRICE_IDS)) {
    if (pid === priceId) return tier;
  }
  return "free";
}

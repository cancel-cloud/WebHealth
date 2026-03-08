import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  agency: process.env.STRIPE_AGENCY_PRICE_ID,
};

export type StripePlan = "pro" | "agency";

/** Maps Stripe price ID → internal tier name */
export function tierFromPriceId(priceId: string): string {
  for (const [tier, pid] of Object.entries(STRIPE_PRICE_IDS)) {
    if (pid === priceId) return tier;
  }
  return "free";
}

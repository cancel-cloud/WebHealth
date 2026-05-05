import type Stripe from "stripe";
import type { StripePlan } from "@/lib/server/stripe";

type StripeCustomerCreateParams = {
  email?: string;
  name?: string;
  metadata: {
    teamId: string;
    userId: string;
  };
};

type StripeCustomerDeps = {
  customers: {
    retrieve: (customerId: string) => Promise<unknown>;
    create: (params: StripeCustomerCreateParams) => Promise<{ id: string }>;
  };
};

type EnsureStripeCustomerIdParams = {
  currentCustomerId?: string | null;
  teamId: string;
  userId: string;
  email?: string | null;
  name?: string | null;
  stripe: StripeCustomerDeps;
  persistCustomerId: (customerId: string) => Promise<void>;
};

export async function ensureStripeCustomerId({
  currentCustomerId,
  teamId,
  userId,
  email,
  name,
  stripe,
  persistCustomerId,
}: EnsureStripeCustomerIdParams): Promise<string> {
  const existingCustomerId = currentCustomerId?.trim();

  if (!existingCustomerId) {
    return await createAndPersistStripeCustomer({
      teamId,
      userId,
      email,
      name,
      stripe,
      persistCustomerId,
    });
  }

  try {
    await stripe.customers.retrieve(existingCustomerId);
    return existingCustomerId;
  } catch (error) {
    if (isMissingStripeCustomerError(error)) {
      return await createAndPersistStripeCustomer({
        teamId,
        userId,
        email,
        name,
        stripe,
        persistCustomerId,
      });
    }

    throw error;
  }
}

async function createAndPersistStripeCustomer({
  teamId,
  userId,
  email,
  name,
  stripe,
  persistCustomerId,
}: Omit<EnsureStripeCustomerIdParams, "currentCustomerId">): Promise<string> {
  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: name ?? undefined,
    metadata: { teamId, userId },
  });

  await persistCustomerId(customer.id);

  return customer.id;
}

function isMissingStripeCustomerError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    type?: unknown;
  };

  return candidate.code === "resource_missing" && candidate.type === "invalid_request_error";
}

type BuildCheckoutSessionParamsInput = {
  customerId: string;
  priceId: string;
  origin: string;
  teamId: string;
  plan: StripePlan;
};

export function buildCheckoutSessionParams({
  customerId,
  priceId,
  origin,
  teamId,
  plan,
}: BuildCheckoutSessionParamsInput): Stripe.Checkout.SessionCreateParams {
  const baseUrl = new URL(origin);
  const termsUrl = new URL("/terms", baseUrl).toString();
  const privacyUrl = new URL("/privacy", baseUrl).toString();
  const impressumUrl = new URL("/impressum", baseUrl).toString();
  const planName = plan === "studio" ? "Studio" : "Starter";

  return {
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: new URL("/settings?stripe=success", baseUrl).toString(),
    cancel_url: new URL("/settings?stripe=cancelled", baseUrl).toString(),
    metadata: { teamId, plan },
    custom_text: {
      submit: {
        message:
          `${planName} renews monthly until you cancel it. ` +
          `Review the terms, privacy policy, and impressum before purchase: ` +
          `${termsUrl}, ${privacyUrl}, ${impressumUrl}.`,
      },
      after_submit: {
        message:
          "Cancellation, invoices, and plan changes stay available in the billing portal from your settings.",
      },
    },
  };
}

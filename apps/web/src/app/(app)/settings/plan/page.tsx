import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check } from "lucide-react";
import { PRICING_PLANS } from "@/lib/pricing";

const PLANS = [
  {
    name: PRICING_PLANS.solo.name,
    price: PRICING_PLANS.solo.priceLabel,
    period: "forever",
    description: "For solo developers getting started.",
    active: true,
    features: PRICING_PLANS.solo.features,
  },
  {
    name: PRICING_PLANS.starter.name,
    price: PRICING_PLANS.starter.priceLabel,
    period: "per month",
    description: PRICING_PLANS.starter.description,
    active: false,
    features: PRICING_PLANS.starter.features,
  },
  {
    name: PRICING_PLANS.studio.name,
    price: PRICING_PLANS.studio.priceLabel,
    period: "per month",
    description: PRICING_PLANS.studio.description,
    active: false,
    features: PRICING_PLANS.studio.features,
  },
  {
    name: PRICING_PLANS.agency.name,
    price: PRICING_PLANS.agency.priceLabel,
    period: "per month",
    description: PRICING_PLANS.agency.description,
    active: false,
    features: [
      "Planned agency collaboration",
      "Client permissions planned",
      "Custom domain planned",
      "SSO planned",
    ],
  },
];

export default function PlanPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/settings">
            <ChevronLeft aria-hidden="true" className="size-4 mr-1" />
            Back to Settings
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight font-display" style={{ textWrap: "balance" }}>
          Plans & Pricing
        </h1>
        <p className="text-muted-foreground mt-1">Choose the plan that fits your needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-lg border p-6 flex flex-col gap-5 ${
              plan.active
                ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
                : "border-border bg-card shadow-sm"
            }`}
          >
            {plan.active && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground shadow-sm">Current Plan</Badge>
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-xl font-semibold font-display">{plan.name}</h2>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold font-display">{plan.price}</span>
              <span className="text-sm text-muted-foreground">/{plan.period}</span>
            </div>

            <ul className="space-y-2 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check aria-hidden="true" className="size-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full rounded-full"
              variant={plan.active ? "outline" : "default"}
              disabled={plan.active}
            >
              {plan.active ? "Current Plan" : `Upgrade to ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        All plans include a 14-day free trial. No credit card required.
      </p>
    </div>
  );
}

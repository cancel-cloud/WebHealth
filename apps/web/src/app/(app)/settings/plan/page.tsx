import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check } from "lucide-react";
import { getLocalizedPricingValue, PUBLIC_PRICING_PLANS } from "@/lib/pricing";
import { requireUnrestrictedSession } from "@/lib/server/authz";
import { getUserPreferredLanguage } from "@/lib/server/language";

const PLAN_PAGE_COPY = {
  en: {
    back: "Back to Settings",
    title: "Plans & Pricing",
    description: "Choose the plan that fits your needs.",
    currentPlan: "Current Plan",
    upgradeTo: "Upgrade to",
    trial: "All plans include a 14-day free trial. No credit card required.",
  },
  de: {
    back: "Zurück zu Einstellungen",
    title: "Pläne & Preise",
    description: "Wähle den Plan, der zu deinem Bedarf passt.",
    currentPlan: "Aktueller Plan",
    upgradeTo: "Upgrade auf",
    trial: "Alle Pläne enthalten eine 14-tägige kostenlose Testphase. Keine Kreditkarte erforderlich.",
  },
} as const;

export default async function PlanPage() {
  const session = await requireUnrestrictedSession();
  const language = await getUserPreferredLanguage(session.user.id);
  const copy = PLAN_PAGE_COPY[language];
  const plans = PUBLIC_PRICING_PLANS.map((plan) => ({
    name: getLocalizedPricingValue(plan.name, language),
    price: getLocalizedPricingValue(plan.price, language),
    period: getLocalizedPricingValue(plan.period, language),
    description: getLocalizedPricingValue(plan.description, language),
    active: plan.tier === "solo",
    features: plan.features.map((feature) => getLocalizedPricingValue(feature, language)),
  }));

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/settings">
            <ChevronLeft aria-hidden="true" className="size-4 mr-1" />
            {copy.back}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-semibold tracking-tight font-display" style={{ textWrap: "balance" }}>
          {copy.title}
        </h1>
        <p className="text-muted-foreground mt-1">{copy.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan) => (
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
                <Badge className="bg-primary text-primary-foreground shadow-sm">{copy.currentPlan}</Badge>
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
              {plan.active ? copy.currentPlan : `${copy.upgradeTo} ${plan.name}`}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {copy.trial}
      </p>
    </div>
  );
}

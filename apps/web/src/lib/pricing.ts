export const PRICING_PLANS = {
  solo: {
    name: "Solo",
    priceLabel: "0€",
    periodLabel: "forever",
    description: "For developers auditing their own sites.",
    reportsPerMonth: 5,
    deepDivesPerMonth: 20,
    features: [
      "Unlimited properties",
      "5 reports / month",
      "20 Deep Dives / month",
      "AI Quick Wins",
      "Live crawl",
    ],
  },
  pro: {
    name: "Pro",
    priceLabel: "38€",
    periodLabel: "/ month",
    description: "For freelancers managing multiple clients — 5× the limits of Solo Plan.",
    reportsPerMonth: 50,
    deepDivesPerMonth: 200,
    features: [
      "Unlimited properties",
      "50 reports / month",
      "200 Deep Dives / month",
      "Priority queue",
      "AI Quick Wins",
      "Email support",
    ],
  },
  agency: {
    name: "Agency",
    priceLabel: "79€",
    periodLabel: "per month",
    description: "For agencies and high-volume clients running SEO at scale.",
  },
} as const;

export function formatEuroDisplay(amount: string | number) {
  return `${String(amount)}€`;
}

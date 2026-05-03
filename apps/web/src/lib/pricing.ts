export type PublicPricingLanguage = "en" | "de";
export type PublicPricingTier = "solo" | "starter" | "studio" | "agency";
export type PublicPricingText = Record<PublicPricingLanguage, string>;

export const PILOT_BOOKING_URL =
  "https://cal.com/lukas-devbrew/webhealth-pilot-check";
export const FOUNDING_AGENCY_PILOT_PRICE_EUR = 149;
export const FOUNDING_AGENCY_PILOT_LIMIT = 10;

export interface PublicPricingPlan {
  tier: PublicPricingTier;
  highlight: boolean;
  badge?: PublicPricingText;
  name: PublicPricingText;
  description: PublicPricingText;
  price: PublicPricingText;
  period: PublicPricingText;
  cta: PublicPricingText;
  features: PublicPricingText[];
  note?: PublicPricingText;
}

export const PRICING_PLANS = {
  solo: {
    name: "Solo",
    priceLabel: "0€",
    periodLabel: "forever",
    description: "For developers auditing their own sites.",
    features: [
      "Unlimited properties",
      "Live property dashboard",
      "Snapshot exports",
      "Ranked fix list",
      "Live crawl",
    ],
  },
  starter: {
    name: "Starter",
    priceLabel: "29€",
    periodLabel: "/ month",
    description: "For freelancers managing multiple client sites.",
    features: [
      "Up to 5 client sites",
      "Live property dashboards",
      "Snapshot exports",
      "White-label on (preview)",
      "Email support",
    ],
  },
  studio: {
    name: "Studio",
    priceLabel: "79€",
    periodLabel: "/ month",
    description: "For small agencies running SEO monthly.",
    features: [
      "Up to 20 client sites",
      "Unlimited snapshots",
      "Priority refreshes",
      "Ranked fix list",
      "Priority support",
    ],
  },
  agency: {
    name: "Agency",
    priceLabel: "149€",
    periodLabel: "base / month",
    description: "Planned for agencies that need collaboration and client controls.",
  },
} as const;

export const PUBLIC_PRICING_PLANS: PublicPricingPlan[] = [
  {
    tier: "solo",
    highlight: false,
    name: { en: "Solo", de: "Solo" },
    description: {
      en: "For freelancers shipping their own site.",
      de: "Für Freelancer mit der eigenen Website.",
    },
    price: { en: "€0", de: "€0" },
    period: { en: "forever", de: "für immer" },
    cta: { en: "Start free", de: "Kostenlos starten" },
    features: [
      { en: "1 property (your own site)", de: "1 Property (deine Website)" },
      { en: "Snapshot exports", de: "Snapshot-Exporte" },
      { en: "Ranked fix list", de: "Priorisierte Fix-Liste" },
      { en: "White-label off", de: "White-Label aus" },
      { en: "Community support", de: "Community-Support" },
    ],
  },
  {
    tier: "starter",
    highlight: false,
    name: { en: "Starter", de: "Starter" },
    description: {
      en: "For freelancers with a handful of clients.",
      de: "Für Freelancer mit einigen Kunden.",
    },
    price: { en: "€29", de: "€29" },
    period: { en: "/ mo", de: "/ Mon." },
    cta: { en: "Start Starter", de: "Starter starten" },
    features: [
      { en: "Up to 5 client sites", de: "Bis zu 5 Kunden-Sites" },
      { en: "Unlimited snapshots", de: "Unbegrenzte Snapshots" },
      { en: "White-label on (preview)", de: "White-Label an (Preview)" },
      { en: "2 team seats", de: "2 Team-Plätze" },
      { en: "Email support", de: "E-Mail-Support" },
    ],
  },
  {
    tier: "studio",
    highlight: true,
    badge: { en: "Most popular", de: "Am beliebtesten" },
    name: { en: "Studio", de: "Studio" },
    description: {
      en: "For small agencies running SEO monthly.",
      de: "Für kleine Agenturen mit monatlichem SEO.",
    },
    price: { en: "€79", de: "€79" },
    period: { en: "/ mo", de: "/ Mon." },
    cta: { en: "Start Studio", de: "Studio starten" },
    features: [
      { en: "Up to 20 client sites", de: "Bis zu 20 Kunden-Sites" },
      { en: "Unlimited snapshots", de: "Unbegrenzte Snapshots" },
      {
        en: "White-label + custom domain (preview)",
        de: "White-Label + Custom Domain (Preview)",
      },
      { en: "5 team seats", de: "5 Team-Plätze" },
      {
        en: "Looker Studio export (planned)",
        de: "Looker-Studio-Export (geplant)",
      },
      { en: "Priority support", de: "Priority-Support" },
    ],
  },
  {
    tier: "agency",
    highlight: false,
    name: { en: "Agency", de: "Agency" },
    description: {
      en: "For agencies at scale. Pay by client count.",
      de: "Für Agenturen in größerem Maßstab. Bezahle nach Kundenanzahl.",
    },
    price: { en: "€149", de: "€149" },
    period: { en: "base / mo", de: "Basis / Mon." },
    cta: { en: "Configure Agency", de: "Agency konfigurieren" },
    note: {
      en: "Up to 25 sites included, then +€6/site",
      de: "Bis zu 25 Sites inklusive, dann +6 €/Site",
    },
    features: [
      { en: "Unlimited team seats", de: "Unbegrenzte Team-Plätze" },
      {
        en: "Per-client access controls (planned)",
        de: "Kundenspezifische Rechte (geplant)",
      },
      { en: "SSO (SAML) planned", de: "SSO (SAML) geplant" },
      { en: "SLA & dedicated support", de: "SLA & dedizierter Support" },
      { en: "Custom onboarding", de: "Custom-Onboarding" },
    ],
  },
];

export const MIN_AGENCY_SITES = 26;
export const MAX_AGENCY_SITES = 200;
export const DEFAULT_AGENCY_SITE_COUNT = 50;

export function getLocalizedPricingValue<T>(
  value: Record<PublicPricingLanguage, T>,
  language: PublicPricingLanguage,
) {
  return value[language];
}

export function getAgencyPrice(siteCount: number) {
  const clampedSiteCount = Math.min(MAX_AGENCY_SITES, Math.max(0, siteCount));
  if (clampedSiteCount <= 25) return 149;
  return 149 + (clampedSiteCount - 25) * 6;
}

export function clampAgencySites(siteCount: number) {
  return Math.min(MAX_AGENCY_SITES, Math.max(MIN_AGENCY_SITES, siteCount));
}

export function formatEuroDisplay(amount: string | number) {
  return `${String(amount)}€`;
}

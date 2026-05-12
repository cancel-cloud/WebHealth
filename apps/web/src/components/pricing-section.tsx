"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPricingBadgeClassNames } from "@/components/pricing-badge-styles";
import {
  FOUNDING_AGENCY_PILOT_LIMIT,
  FOUNDING_AGENCY_PILOT_PRICE_EUR,
  getLocalizedPricingValue,
  PILOT_BOOKING_URL,
  PUBLIC_PRICING_PLANS,
  type PublicPricingLanguage,
} from "@/lib/pricing";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const PRICING_SECTION_COPY = {
  eyebrow: { en: "Pilot offer", de: "Pilot-Angebot" },
  title: {
    en: "First month free. Then EUR 149/month.",
    de: "Erster Monat kostenlos. Danach 149 EUR/Monat.",
  },
  lead: {
    en: "The recommended path for agencies is the Founding Agency Pilot: founder-led setup, 3-10 client websites, a branded monthly snapshot, and a prioritized action backlog.",
    de: "Der empfohlene Weg für Agenturen ist der Founding Agency Pilot: founder-led Setup, 3-10 Kunden-Websites, ein gebrandeter Monats-Snapshot und ein priorisierter Maßnahmen-Backlog.",
  },
  pilotBadge: { en: "Founding Agency Pilot", de: "Founding Agency Pilot" },
  pilotTitle: {
    en: "Free first month in exchange for honest feedback and anonymized learnings.",
    de: "Kostenloser erster Monat gegen ehrliches Feedback und anonymisierte Learnings.",
  },
  pilotLead: {
    en: `Limited to ${FOUNDING_AGENCY_PILOT_LIMIT} agencies because setup and feedback are founder-led. Founding Agencies keep EUR ${FOUNDING_AGENCY_PILOT_PRICE_EUR}/month for 12 months; later agency prices will be higher.`,
    de: `Limitiert auf ${FOUNDING_AGENCY_PILOT_LIMIT} Agenturen, weil Setup und Feedback founder-led sind. Founding Agencies behalten ${FOUNDING_AGENCY_PILOT_PRICE_EUR} EUR/Monat für 12 Monate; spätere Agenturpreise werden höher liegen.`,
  },
  pilotSetupTitle: {
    en: "Set up 3-10 client websites.",
    de: "3-10 Kunden-Websites einrichten.",
  },
  pilotSteps: {
    en: [
      "Deliver a branded monthly snapshot",
      "Connect traffic drops with crawl, content, and analytics signals",
      "Prioritize the most important SEO actions",
      "No Stripe entry before the free pilot month",
    ],
    de: [
      "Gebrandeten Monats-Snapshot liefern",
      "Traffic-Drops mit Crawl-, Content- und Analytics-Signalen verbinden",
      "Wichtigste SEO-Maßnahmen priorisieren",
      "Kein Stripe-Eintrag vor dem kostenlosen Pilot-Monat",
    ],
  },
  pilotCta: {
    en: "Book a 12-min pilot check",
    de: "12-Minuten Pilot-Check buchen",
  },
  selfServeLabel: {
    en: "For individual projects or later self-serve use",
    de: "Für Einzelprojekte oder spätere Self-Serve-Nutzung",
  },
} satisfies Record<string, Record<PublicPricingLanguage, unknown>>;

export function PricingSection({
  language = "de",
}: {
  language?: PublicPricingLanguage;
}) {
  const pricingBadgeClasses = getPricingBadgeClassNames();
  const selfServePlans = PUBLIC_PRICING_PLANS.filter((plan) => plan.tier !== "agency");
  const agencyPlan = PUBLIC_PRICING_PLANS.find((plan) => plan.tier === "agency");

  return (
    <section
      id="pricing"
      className="py-28 px-6 scroll-mt-16"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-16 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#6366f1" }}
          >
            {PRICING_SECTION_COPY.eyebrow[language]}
          </p>
          <h1
            id="pricing-heading"
            className="font-display text-4xl md:text-5xl font-semibold tracking-tight"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            {PRICING_SECTION_COPY.title[language]}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            {PRICING_SECTION_COPY.lead[language]}
          </p>
        </div>

        <motion.article
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="rounded-lg border bg-white p-8 shadow-sm"
          style={{
            borderColor: "#6366f144",
            boxShadow: "0 0 0 4px #6366f115, 0 14px 40px #6366f118",
          }}
        >
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                {PRICING_SECTION_COPY.pilotBadge[language]}
              </span>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                {PRICING_SECTION_COPY.pilotTitle[language]}
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {PRICING_SECTION_COPY.pilotLead[language]}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/35 p-5">
              <p className="font-display text-2xl font-bold">
                {PRICING_SECTION_COPY.pilotSetupTitle[language]}
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-6">
                {PRICING_SECTION_COPY.pilotSteps[language].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                      style={{ color: "#6366f1" }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={PILOT_BOOKING_URL}
                className="mt-6 flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                style={{
                  backgroundImage: "linear-gradient(90deg, #6366f1, #0ea5e9)",
                }}
              >
                {PRICING_SECTION_COPY.pilotCta[language]}
              </Link>
            </div>
          </div>
        </motion.article>

        <div className="mb-8 mt-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {PRICING_SECTION_COPY.selfServeLabel[language]}
          </p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-5 items-stretch"
        >
          {selfServePlans.map((plan) => (
            <motion.div
              key={plan.tier}
              variants={fadeUp}
              className={`rounded-lg p-8 flex flex-col bg-white h-full ${
                plan.highlight ? "md:-translate-y-2" : ""
              }`}
              style={{
                border: plan.highlight
                  ? "1.5px solid #6366f1"
                  : "1px solid oklch(0.91 0.01 250)",
                boxShadow: plan.highlight
                  ? "0 0 0 4px #6366f115, 0 8px 28px #6366f118"
                  : "0 1px 4px oklch(0 0 0 / 0.04)",
              }}
            >
              <div className="min-h-7">
                {plan.highlight && (
                  <span
                    className={`self-start ${pricingBadgeClasses.base} ${pricingBadgeClasses.mostPopularSpacing} ${pricingBadgeClasses.mostPopular}`}
                  >
                    {getLocalizedPricingValue(plan.badge!, language)}
                  </span>
                )}
              </div>
              <div className="mt-4 min-h-[8.5rem]">
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest">
                  {getLocalizedPricingValue(plan.name, language)}
                </h2>
                <p
                  className="mt-2 text-xs min-w-0"
                  style={{ color: "oklch(0.55 0.02 250)" }}
                >
                  {getLocalizedPricingValue(plan.description, language)}
                </p>
              </div>
              <div className="flex min-h-16 items-end gap-1">
                <span className="font-display text-4xl font-bold tabular-nums">
                  {getLocalizedPricingValue(plan.price, language)}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "oklch(0.6 0.02 250)" }}
                >
                  {getLocalizedPricingValue(plan.period, language)}
                </span>
              </div>
              <div className="mt-3 min-h-10">
                {plan.note ? (
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.55 0.02 250)" }}
                  >
                    {getLocalizedPricingValue(plan.note, language)}
                  </p>
                ) : null}
              </div>
              {plan.features.length > 0 && (
                <ul className="mt-6 space-y-2.5 flex-1">
                  {plan.features.map((feat) => (
                    <li
                      key={feat.en}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check
                        className="size-4 mt-0.5 shrink-0"
                        aria-hidden="true"
                        style={{ color: "#6366f1" }}
                      />
                      <span className="min-w-0">
                        {getLocalizedPricingValue(feat, language)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-auto pt-6">
                {plan.highlight ? (
                  <Link
                    href="/dashboard"
                    className="flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #6366f1, #0ea5e9)",
                    }}
                  >
                    {getLocalizedPricingValue(plan.cta, language)}
                  </Link>
                ) : (
                  <a
                    href={
                      plan.tier === "agency"
                        ? "mailto:kontakt@devbrew.dev?subject=Webhealth%20Agency%20Interest"
                        : "/dashboard"
                    }
                  >
                    <Button
                      className="h-10 w-full rounded-full text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 touch-manipulation"
                      style={{
                        backgroundColor: "#6366f10e",
                        color: "#6366f1",
                        border: "1px solid #6366f122",
                      }}
                    >
                      {getLocalizedPricingValue(plan.cta, language)}
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {agencyPlan ? (
          <motion.article
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-6 rounded-lg border bg-white p-6 shadow-sm"
            style={{
              borderColor: "oklch(0.91 0.01 250)",
              boxShadow: "0 1px 4px oklch(0 0 0 / 0.04)",
            }}
          >
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest">
                  {getLocalizedPricingValue(agencyPlan.name, language)}
                </h2>
                <p
                  className="mt-2 max-w-2xl text-sm leading-6"
                  style={{ color: "oklch(0.55 0.02 250)" }}
                >
                  {getLocalizedPricingValue(agencyPlan.description, language)}
                </p>
                {agencyPlan.note ? (
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {getLocalizedPricingValue(agencyPlan.note, language)}
                  </p>
                ) : null}
              </div>
              <div className="md:min-w-56">
                <div className="flex items-end gap-1">
                  <span className="font-display text-4xl font-bold tabular-nums">
                    {getLocalizedPricingValue(agencyPlan.price, language)}
                  </span>
                  <span
                    className="pb-1 text-sm"
                    style={{ color: "oklch(0.6 0.02 250)" }}
                  >
                    {getLocalizedPricingValue(agencyPlan.period, language)}
                  </span>
                </div>
                <a href="mailto:kontakt@devbrew.dev?subject=Webhealth%20Agency%20Interest">
                  <Button
                    className="mt-4 h-10 w-full rounded-full text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 touch-manipulation"
                    style={{
                      backgroundColor: "#6366f10e",
                      color: "#6366f1",
                      border: "1px solid #6366f122",
                    }}
                  >
                    {getLocalizedPricingValue(agencyPlan.cta, language)}
                  </Button>
                </a>
              </div>
            </div>
            <ul className="mt-6 grid gap-3 text-sm md:grid-cols-2">
              {agencyPlan.features.map((feature) => (
                <li key={feature.en} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                    style={{ color: "#6366f1" }}
                  />
                  <span>{getLocalizedPricingValue(feature, language)}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        ) : null}
      </div>
    </section>
  );
}

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

export function PricingSection() {
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
            Pilot-Angebot
          </p>
          <h1
            id="pricing-heading"
            className="font-display text-4xl md:text-5xl font-semibold tracking-tight"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Erster Monat kostenlos. Danach {FOUNDING_AGENCY_PILOT_PRICE_EUR} EUR/Monat.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Der empfohlene Weg für Agenturen ist der Founding Agency Pilot:
            founder-led Setup, 3-10 Kunden-Websites, ein gebrandeter
            Monats-Snapshot und ein priorisierter Maßnahmen-Backlog.
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
                Founding Agency Pilot
              </span>
              <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Kostenloser erster Monat gegen ehrliches Feedback und
                anonymisierte Learnings.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Limitiert auf {FOUNDING_AGENCY_PILOT_LIMIT} Agenturen, weil
                Setup und Feedback founder-led sind. Founding Agencies behalten
                {FOUNDING_AGENCY_PILOT_PRICE_EUR} EUR/Monat für 12 Monate;
                spätere Agenturpreise werden höher liegen.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/35 p-5">
              <p className="font-display text-2xl font-bold">
                3-10 Kunden-Websites einrichten.
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-6">
                {[
                  "Gebrandeten Monats-Snapshot liefern",
                  "Traffic-Drops mit Crawl-, Content- und Analytics-Signalen verbinden",
                  "Wichtigste SEO-Maßnahmen priorisieren",
                  "Kein Stripe-Eintrag vor dem kostenlosen Pilot-Monat",
                ].map((item) => (
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
                12-Minuten Pilot-Check buchen
              </Link>
            </div>
          </div>
        </motion.article>

        <div className="mb-8 mt-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Für Einzelprojekte oder spätere Self-Serve-Nutzung
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
                plan.highlight ? "md:-tranzinc-y-2" : ""
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
                    {getLocalizedPricingValue(plan.badge!, "en")}
                  </span>
                )}
              </div>
              <div className="mt-4 min-h-[8.5rem]">
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest">
                  {getLocalizedPricingValue(plan.name, "en")}
                </h2>
                <p
                  className="mt-2 text-xs min-w-0"
                  style={{ color: "oklch(0.55 0.02 250)" }}
                >
                  {getLocalizedPricingValue(plan.description, "en")}
                </p>
              </div>
              <div className="flex min-h-16 items-end gap-1">
                <span className="font-display text-4xl font-bold tabular-nums">
                  {getLocalizedPricingValue(plan.price, "en")}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "oklch(0.6 0.02 250)" }}
                >
                  {getLocalizedPricingValue(plan.period, "en")}
                </span>
              </div>
              <div className="mt-3 min-h-10">
                {plan.note ? (
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.55 0.02 250)" }}
                  >
                    {getLocalizedPricingValue(plan.note, "en")}
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
                        {getLocalizedPricingValue(feat, "en")}
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
                    {getLocalizedPricingValue(plan.cta, "en")}
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
                      {getLocalizedPricingValue(plan.cta, "en")}
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
                  {getLocalizedPricingValue(agencyPlan.name, "en")}
                </h2>
                <p
                  className="mt-2 max-w-2xl text-sm leading-6"
                  style={{ color: "oklch(0.55 0.02 250)" }}
                >
                  {getLocalizedPricingValue(agencyPlan.description, "en")}
                </p>
                {agencyPlan.note ? (
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {getLocalizedPricingValue(agencyPlan.note, "en")}
                  </p>
                ) : null}
              </div>
              <div className="md:min-w-56">
                <div className="flex items-end gap-1">
                  <span className="font-display text-4xl font-bold tabular-nums">
                    {getLocalizedPricingValue(agencyPlan.price, "en")}
                  </span>
                  <span
                    className="pb-1 text-sm"
                    style={{ color: "oklch(0.6 0.02 250)" }}
                  >
                    {getLocalizedPricingValue(agencyPlan.period, "en")}
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
                    {getLocalizedPricingValue(agencyPlan.cta, "en")}
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
                  <span>{getLocalizedPricingValue(feature, "en")}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        ) : null}
      </div>
    </section>
  );
}

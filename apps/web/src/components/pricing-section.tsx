"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPricingBadgeClassNames } from "@/components/pricing-badge-styles";
import { PRICING_PLANS } from "@/lib/pricing";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const PRICING = [
  {
    name: PRICING_PLANS.solo.name,
    price: PRICING_PLANS.solo.priceLabel,
    period: PRICING_PLANS.solo.periodLabel,
    description: PRICING_PLANS.solo.description,
    cta: "Start Free",
    href: "/dashboard",
    features: PRICING_PLANS.solo.features,
    comingSoon: false,
    highlight: false,
  },
  {
    name: PRICING_PLANS.pro.name,
    price: PRICING_PLANS.pro.priceLabel,
    period: PRICING_PLANS.pro.periodLabel,
    description: PRICING_PLANS.pro.description,
    cta: "Get Started",
    href: "/dashboard",
    features: PRICING_PLANS.pro.features,
    comingSoon: false,
    highlight: true,
  },
  {
    name: "Agency",
    price: "",
    period: "",
    description: "For agencies and high-volume clients running SEO at scale.",
    cta: "Get early access",
    href: "mailto:contact@devbrew.dev?subject=Webhealth%20Agency%20Interest",
    features: [] as string[],
    comingSoon: true,
    highlight: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export function PricingSection() {
  const pricingBadgeClasses = getPricingBadgeClassNames();

  return (
    <section id="pricing" className="py-28 px-6 scroll-mt-16" aria-labelledby="pricing-heading">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#6366f1" }}
          >
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="font-display text-4xl md:text-5xl font-bold tracking-tight"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Simple. Transparent. No surprises.
          </h2>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-5 items-stretch"
        >
          {PRICING.map((plan) => (
            <motion.div
              key={plan.name}
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
              {plan.highlight && (
                <span
                  className={`self-start mb-4 ${pricingBadgeClasses.base} ${pricingBadgeClasses.mostPopularSpacing} ${pricingBadgeClasses.mostPopular}`}
                >
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-sm font-semibold uppercase tracking-widest">
                  {plan.name}
                </h3>
                {plan.comingSoon && (
                  <span
                    className={`${pricingBadgeClasses.base} ${pricingBadgeClasses.comingSoonSpacing} ${pricingBadgeClasses.comingSoon}`}
                  >
                    Coming Soon
                  </span>
                )}
              </div>
              <p
                className="text-xs mb-6 min-w-0"
                style={{ color: "oklch(0.55 0.02 250)" }}
              >
                {plan.description}
              </p>
              {plan.price ? (
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="font-display text-4xl font-bold tabular-nums">
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: "oklch(0.6 0.02 250)" }}>
                    {plan.period}
                  </span>
                </div>
              ) : (
                <p className="text-xs mb-8 italic" style={{ color: "oklch(0.55 0.02 250)" }}>
                  Pricing available on request — get in touch to be first in line.
                </p>
              )}
              {plan.features.length > 0 && (
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check
                        className="size-4 mt-0.5 shrink-0"
                        aria-hidden="true"
                        style={{ color: "#6366f1" }}
                      />
                      <span className="min-w-0">{feat}</span>
                    </li>
                  ))}
                </ul>
              )}
              {plan.highlight ? (
                <Link
                  href={plan.href}
                  className="flex items-center justify-center h-10 w-full rounded-full text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation mt-auto"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #6366f1, #0ea5e9)",
                  }}
                >
                  {plan.cta}
                </Link>
              ) : (
                <a href={plan.href} className="mt-auto">
                  <Button
                    className="w-full rounded-full h-10 text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 touch-manipulation"
                    style={{
                      backgroundColor: "#6366f10e",
                      color: "#6366f1",
                      border: "1px solid #6366f122",
                    }}
                  >
                    {plan.cta}
                  </Button>
                </a>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

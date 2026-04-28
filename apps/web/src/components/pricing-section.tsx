"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPricingBadgeClassNames } from "@/components/pricing-badge-styles";
import {
  getLocalizedPricingValue,
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
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch"
        >
          {PUBLIC_PRICING_PLANS.map((plan) => (
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
                    {getLocalizedPricingValue(plan.badge!, "en")}
                  </span>
                )}
              </div>
              <div className="mt-4 min-h-[8.5rem]">
                <h3 className="font-display text-sm font-semibold uppercase tracking-widest">
                  {getLocalizedPricingValue(plan.name, "en")}
                </h3>
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
      </div>
    </section>
  );
}

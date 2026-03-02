"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe2, BarChart2, Zap, Search, TrendingUp, FileDown, Check, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { authClient } from "@webhealth/shared/lib/auth-client";

/* ─── Palette ────────────────────────────────────────────────────────── */
// Primary: indigo #6366f1  Accent: cyan #06b6d4  Success: emerald #10b981
// Warn: amber #f59e0b  Info: sky #0ea5e9  Danger: rose #f43f5e
// No purple gradients anywhere.

/* ─── Data ──────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Globe2,
    color: "#6366f1",
    tint: "#6366f10c",
    border: "#6366f11e",
    title: "Connect once. Never manually check again.",
    description:
      "One OAuth grant discovers every GSC and GA4 property automatically — no copy-pasting IDs, no config to maintain.",
  },
  {
    icon: BarChart2,
    color: "#0ea5e9",
    tint: "#0ea5e90c",
    border: "#0ea5e91e",
    title: "Before vs. after — deltas you can act on.",
    description:
      "Pick two date ranges. Clicks, impressions, CTR, position, sessions, and users side-by-side with signed deltas.",
  },
  {
    icon: Zap,
    color: "#f59e0b",
    tint: "#f59e0b0c",
    border: "#f59e0b1e",
    title: "GPT-ranked fixes with URLs and impact scores.",
    description:
      "The AI reads your crawl data and traffic deltas, then returns a prioritised fix list per page — not vague advice.",
  },
  {
    icon: Search,
    color: "#f43f5e",
    tint: "#f43f5e0c",
    border: "#f43f5e1e",
    title: "Fresh crawl per report: broken H1s, 4xx links.",
    description:
      "Every report triggers a live crawl. Missing titles, duplicate H1s, absent meta descriptions, 4xx internal links — all flagged.",
  },
  {
    icon: TrendingUp,
    color: "#10b981",
    tint: "#10b9810c",
    border: "#10b9811e",
    title: "Which pages are bleeding and which are climbing.",
    description:
      "Top queries and pages ranked by traffic delta. Spot what dropped after your last deploy — immediately.",
  },
  {
    icon: FileDown,
    color: "#06b6d4",
    tint: "#06b6d40c",
    border: "#06b6d41e",
    title: "PDF, Excel, Markdown — client-ready or CMS-paste.",
    description:
      "Download any report in the format your workflow expects. No formatting gymnastics required.",
  },
];

const PRICING = [
  {
    name: "Solo",
    price: "$0",
    period: "forever",
    description: "For developers auditing their own sites.",
    cta: "Start Free",
    href: "/dashboard",
    features: ["Up to 3 properties", "5 reports / month", "AI Quick Wins", "Live crawl"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    description: "For freelancers managing multiple clients.",
    cta: "Get Started",
    href: "/dashboard",
    features: [
      "Unlimited properties",
      "50 reports / month",
      "PDF + Excel exports",
      "Priority crawling",
      "Team workspace",
    ],
    highlight: true,
  },
  {
    name: "Agency",
    price: "$79",
    period: "/ month",
    description: "For high-volume reporting at scale.",
    cta: "Contact Us",
    href: "/dashboard",
    features: [
      "Unlimited everything",
      "White-label exports",
      "Custom AI prompts",
      "API access",
      "Dedicated support",
    ],
    highlight: false,
  },
];

const STEPS = [
  {
    n: "01",
    color: "#6366f1",
    tint: "#6366f114",
    title: "Sign in with Google",
    desc: "One OAuth click. WebAudit immediately discovers all your GSC and GA4 properties.",
  },
  {
    n: "02",
    color: "#0ea5e9",
    tint: "#0ea5e914",
    title: "Create a comparison report",
    desc: "Pick a property, choose two date periods, hit Generate. We crawl, fetch, and analyse automatically.",
  },
  {
    n: "03",
    color: "#10b981",
    tint: "#10b98114",
    title: "Take action on Quick Wins",
    desc: "Your AI-ranked fix list tells you exactly what to change — with affected URLs and impact scores.",
  },
];

const STATS = [
  { value: "2 min", label: "average setup time" },
  { value: "100%", label: "automated workflow" },
  { value: "$0", label: "to get started" },
];

/* ─── Animation variants ────────────────────────────────────────────── */
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

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function HomePage() {
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <>
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2 focus:bg-white focus:rounded-lg focus:font-medium focus:shadow-lg focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:outline-none"
        style={{ color: "#6366f1" }}
      >
        Skip to main content
      </a>

      <div
        className="flex-1 flex flex-col"
        style={{ backgroundColor: "oklch(0.99 0 0)", color: "oklch(0.12 0.01 250)" }}
      >

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        {/*
          The negative top margin pulls this section UP behind the sticky navbar.
          The navbar has bg-background/80 + backdrop-blur so the gradient shows through it,
          giving the "header overlaid on top of the hero background" effect.
          Padding-top compensates so text stays in the readable area below the nav.
        */}
        <section
          id="main-content"
          className="relative flex flex-col items-center justify-center text-center px-6 pb-36 overflow-hidden"
          style={{ marginTop: "-64px", paddingTop: "calc(64px + 5rem)", minHeight: "100svh" }}
          aria-labelledby="hero-heading"
        >
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.12 0.01 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.12 0.01 250) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            {/* Status pill */}
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold mb-10 motion-safe:animate-[fade-in_0.4s_ease_both]"
              style={{
                borderColor: "#6366f128",
                color: "#6366f1",
                backgroundColor: "#6366f108",
              }}
            >
              <span
                className="size-1.5 rounded-full motion-safe:animate-pulse"
                style={{ backgroundColor: "#6366f1" }}
                aria-hidden="true"
              />
              Now in beta · Free to start
            </div>

            <h1
              id="hero-heading"
              className="font-display text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.05] mb-8 text-center w-full motion-safe:animate-[fade-slide-up_0.55s_0.1s_ease_both] opacity-0 [animation-fill-mode:forwards]"
            >
              Site health.
              <br />
              <span
                className="text-primary"
              >
                Finally&nbsp;automated.
              </span>
            </h1>

            <p
              className="text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-12 motion-safe:animate-[fade-slide-up_0.55s_0.2s_ease_both] opacity-0 [animation-fill-mode:forwards]"
              style={{ color: "oklch(0.45 0.02 250)" }}
            >
              WebAudit syncs your GSC and GA4 data, crawls your site on demand, and delivers
              AI&#8209;ranked fixes — without the dashboard babysitting.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 motion-safe:animate-[fade-slide-up_0.55s_0.3s_ease_both] opacity-0 [animation-fill-mode:forwards]">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation motion-safe:animate-[gradient-pan_6s_ease_infinite] bg-[length:200%_100%]"
                style={{ backgroundImage: "linear-gradient(90deg, #6366f1, #0ea5e9, #6366f1)" }}
              >
                Connect your Google account
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </button>
              <Button
                variant="ghost"
                className="h-12 px-8 rounded-full text-sm font-medium focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 touch-manipulation"
                style={{ color: "oklch(0.45 0.02 250)" }}
              >
                See a sample report
              </Button>
            </div>

            <p
              className="text-xs motion-safe:animate-[fade-in_0.5s_0.5s_ease_both] opacity-0 [animation-fill-mode:forwards]"
              style={{ color: "oklch(0.62 0.02 250)" }}
            >
              No credit card required · 2&#8209;minute setup
            </p>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────── */}
        <section id="features" className="py-28 px-6 scroll-mt-16" aria-labelledby="features-heading">
          <div className="max-w-5xl mx-auto">
            <div className="mb-20 max-w-xl">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#6366f1" }}
              >
                Features
              </p>
              <h2
                id="features-heading"
                className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-tight"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                Everything an automated workflow needs.
              </h2>
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {FEATURES.map((f) => (
                <motion.article
                  key={f.title}
                  variants={fadeUp}
                  className="rounded-2xl p-6 flex flex-col gap-4 touch-manipulation"
                  style={{
                    backgroundColor: f.tint,
                    border: `1px solid ${f.border}`,
                  }}
                >
                  <div
                    className="size-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${f.color}18`,
                      border: `1px solid ${f.color}28`,
                    }}
                  >
                    <f.icon className="size-6" aria-hidden="true" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3
                      className="font-display text-[15px] font-bold mb-2 leading-snug"
                      style={{ textWrap: "balance" } as React.CSSProperties}
                    >
                      {f.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed min-w-0"
                      style={{ color: "oklch(0.45 0.02 250)" }}
                    >
                      {f.description}
                    </p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <section
          className="py-28 px-6 border-y"
          style={{
            borderColor: "oklch(0.91 0.01 250)",
            backgroundColor: "oklch(0.975 0.003 250)",
          }}
          aria-labelledby="how-heading"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "#6366f1" }}
              >
                How it works
              </p>
              <h2
                id="how-heading"
                className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                From sign-in to insights in{" "}
                <span style={{ color: "#6366f1" }}>under&nbsp;3&nbsp;minutes</span>
              </h2>
              <p
                className="text-lg mb-16 max-w-md mx-auto"
                style={{ color: "oklch(0.50 0.02 250)" }}
              >
                Three steps. No complicated setup.
              </p>
            </motion.div>

            <motion.ol
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="grid md:grid-cols-3 gap-8"
              aria-label="Setup steps"
            >
              {STEPS.map((s) => (
                <motion.li
                  key={s.n}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className="size-16 rounded-2xl flex items-center justify-center font-display text-2xl font-extrabold mb-6 tabular-nums shrink-0"
                    style={{
                      backgroundColor: s.tint,
                      color: s.color,
                      border: `1.5px solid ${s.color}28`,
                    }}
                    aria-hidden="true"
                  >
                    {s.n}
                  </div>
                  <h3
                    className="font-display text-xl font-bold mb-3"
                    style={{ textWrap: "balance" } as React.CSSProperties}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed min-w-0"
                    style={{ color: "oklch(0.50 0.02 250)" }}
                  >
                    {s.desc}
                  </p>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────────── */}
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
              className="grid md:grid-cols-3 gap-5 items-start"
            >
              {PRICING.map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  className={`rounded-2xl p-8 flex flex-col bg-white ${
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
                      className="self-start text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                      style={{
                        background: "#f59e0b",
                        color: "#451a03",
                      }}
                    >
                      Most popular
                    </span>
                  )}
                  <h3 className="font-display text-sm font-semibold uppercase tracking-widest mb-1">
                    {plan.name}
                  </h3>
                  <p
                    className="text-xs mb-6 min-w-0"
                    style={{ color: "oklch(0.55 0.02 250)" }}
                  >
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="font-display text-4xl font-bold tabular-nums">
                      {plan.price}
                    </span>
                    <span className="text-sm" style={{ color: "oklch(0.6 0.02 250)" }}>
                      {plan.period}
                    </span>
                  </div>
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
                  {plan.highlight ? (
                    <Link
                      href={plan.href}
                      className="flex items-center justify-center h-10 w-full rounded-full text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation"
                      style={{
                        backgroundImage: "linear-gradient(90deg, #6366f1, #0ea5e9)",
                      }}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <Link href={plan.href}>
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
                    </Link>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA — Light indigo tint band, horizontal layout ──────────── */}
        <section
          className="relative overflow-hidden border-t"
          style={{
            backgroundColor: "#6366f108",
            borderColor: "#6366f11a",
          }}
          aria-labelledby="cta-heading"
        >
          {/* Soft radial blooms */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 10% 50%, #6366f10e 0%, transparent 60%), radial-gradient(ellipse 50% 70% at 90% 50%, #06b6d408 0%, transparent 60%)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

              {/* Left — claim + stats */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles
                    className="size-4"
                    aria-hidden="true"
                    style={{ color: "#6366f1" }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "#6366f1" }}
                  >
                    Start today
                  </span>
                </div>

                <h2
                  id="cta-heading"
                  className="font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-8"
                  style={{ color: "oklch(0.12 0.01 250)", textWrap: "balance" } as React.CSSProperties}
                >
                  Your GSC data is sitting there.
                  <br />
                  <span className="text-primary">
                    Put it to work.
                  </span>
                </h2>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  {STATS.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl px-4 py-4 text-center bg-white"
                      style={{
                        border: "1px solid #6366f11a",
                        boxShadow: "0 1px 4px oklch(0 0 0 / 0.04)",
                      }}
                    >
                      <div
                        className="font-display text-2xl font-extrabold tabular-nums mb-1"
                        style={{ color: "#6366f1" }}
                      >
                        {s.value}
                      </div>
                      <div
                        className="text-[11px] leading-tight min-w-0"
                        style={{ color: "oklch(0.55 0.02 250)" }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right — CTA */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex flex-col items-start lg:items-end"
              >
                <div
                  className="w-full max-w-sm rounded-2xl p-8 flex flex-col gap-6 bg-white"
                  style={{
                    border: "1px solid #6366f11a",
                    boxShadow: "0 4px 24px #6366f10e",
                  }}
                >
                  <div>
                    <p
                      className="text-base font-semibold mb-2"
                      style={{ color: "oklch(0.12 0.01 250)" }}
                    >
                      Free forever on Solo plan.
                    </p>
                    <p className="text-sm" style={{ color: "oklch(0.50 0.02 250)" }}>
                      Sign in with Google and generate your first audit report in under
                      3&nbsp;minutes. No credit card, no friction.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="inline-flex items-center justify-center gap-2 h-12 w-full rounded-full text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:outline-none touch-manipulation motion-safe:animate-[gradient-pan_6s_ease_infinite] bg-[length:200%_100%]"
                    style={{
                      backgroundImage: "linear-gradient(90deg, #6366f1, #06b6d4, #6366f1)",
                      boxShadow: "0 4px 18px #6366f132",
                    }}
                  >
                    Connect your Google account
                    <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                  </button>

                  <ul className="space-y-2">
                    {["No credit card required", "GSC + GA4 in one place", "Cancel any time"].map(
                      (item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-xs"
                          style={{ color: "oklch(0.55 0.02 250)" }}
                        >
                          <Check
                            className="size-3.5 shrink-0"
                            aria-hidden="true"
                            style={{ color: "#10b981" }}
                          />
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CSS keyframes — compositor-only (transform + opacity only) */}
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes fade-slide-up {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes gradient-pan {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    </>
  );
}

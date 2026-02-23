"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ArrowRight, BarChart2, Zap, Globe2, Search, TrendingUp, Shield, FileDown, Users, Check } from "lucide-react";
import { useRef } from "react";

const FEATURES = [
  {
    icon: Globe2,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Instant Property Sync",
    description: "Connect once with Google. All your Search Console and Analytics properties are automatically discovered and synced.",
  },
  {
    icon: BarChart2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    title: "Period Comparison Reports",
    description: "Choose any two date ranges. See deltas for clicks, impressions, CTR, position, sessions, and users side-by-side.",
  },
  {
    icon: Zap,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    title: "AI Quick Wins",
    description: "GPT-powered analysis of your crawl data and traffic deltas gives you a ranked list of specific, actionable next steps.",
  },
  {
    icon: Search,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    title: "Live Web Crawl",
    description: "Every report triggers a fresh crawl: missing titles, broken H1s, absent meta descriptions, and 4xx internal links.",
  },
  {
    icon: TrendingUp,
    color: "text-green-500",
    bg: "bg-green-500/10",
    title: "Top Queries & Pages",
    description: "See which queries and pages drive the most traffic, with month-over-month deltas to spot what's trending up or dropping.",
  },
  {
    icon: FileDown,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    title: "Export Everything",
    description: "Download any report as PDF, Excel (.xlsx), or clean Markdown — ready to share with your client or copy into your CMS.",
  },
];

const PRICING = [
  {
    name: "Solo",
    price: "$0",
    period: "forever",
    description: "For individual developers auditing their own sites.",
    cta: "Start Free",
    features: ["Up to 3 properties", "5 reports/month", "AI Quick Wins", "Live crawl"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    description: "For freelancers and agencies managing multiple clients.",
    cta: "Get Started",
    features: ["Unlimited properties", "50 reports/month", "PDF + Excel exports", "Priority crawling", "Team workspace"],
    highlight: true,
  },
  {
    name: "Agency",
    price: "$79",
    period: "/ month",
    description: "For large agencies with high-volume reporting needs.",
    cta: "Contact Us",
    features: ["Unlimited everything", "White-label exports", "Custom AI prompts", "API access", "Dedicated support"],
    highlight: false,
  },
];

const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } } };

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="flex-1 bg-background">

      {/* ── HERO ────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Parallax background — pointer-events-none so they never block clicks */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 pointer-events-none z-0"
        >
          <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-2xl" />
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />
        </motion.div>

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
            Now in Beta · Free to get started
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tighter font-outfit leading-tight"
          >
            One dashboard for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-500">every SEO signal</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            WebAudit syncs Google Search Console & Analytics, crawls your site, and delivers <span className="text-foreground font-semibold">AI-ranked Quick Wins</span> — all in one comparison report.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-2"
          >
            <Link href="/dashboard">
              <Button size="lg" className="h-14 px-10 text-lg rounded-full font-semibold group shadow-lg shadow-primary/20">
                Start Auditing Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg rounded-full font-semibold border-border/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all">
              See a Sample Report
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-muted-foreground"
          >
            No credit card required · Sign in with Google · 2-minute setup
          </motion.p>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────── */}
      <section className="py-28 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight font-outfit mb-4">
              Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">outrank the competition</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              WebAudit consolidates all your SEO data into a single, automated workflow — from crawl to report to action.
            </p>
          </motion.div>

          <motion.div
            variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={item} className={`group p-8 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden ${i === 1 ? 'lg:-translate-y-3' : ''}`}>
                <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:opacity-100 opacity-0 transition-opacity duration-300`} style={{ background: `radial-gradient(ellipse at top left, var(--tw-gradient-from), transparent)` }} />
                <div className={`h-12 w-12 rounded-2xl ${f.bg} flex items-center justify-center mb-6 ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold mb-2 font-outfit">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────── */}
      <section className="py-28 px-4 bg-muted/30 border-y border-border/50">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-extrabold tracking-tight font-outfit mb-4">
              From sign-in to insights in <span className="text-primary">under 3 minutes</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-16">Three steps. No complicated setup.</p>
          </motion.div>

          <motion.div
            variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { step: "01", title: "Sign in with Google", desc: "One OAuth click. WebAudit immediately discovers all your GSC and GA4 properties." },
              { step: "02", title: "Create a comparison report", desc: "Pick a property, choose two date periods, hit Generate. We crawl, fetch, and analyze automatically." },
              { step: "03", title: "Take action on Quick Wins", desc: "Your AI-ranked Quick Wins list tells you exactly what to fix — with affected URLs and impact scores." },
            ].map((s) => (
              <motion.div key={s.step} variants={item} className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-extrabold text-primary font-outfit mb-6">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold font-outfit mb-3">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────── */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold tracking-tight font-outfit mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-muted-foreground">Start free. Scale when you're ready.</p>
          </motion.div>

          <motion.div
            variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-3 gap-6"
          >
            {PRICING.map((plan) => (
              <motion.div
                key={plan.name} variants={item}
                className={`relative p-8 rounded-3xl border ${plan.highlight ? 'bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/25 scale-105' : 'bg-card border-border/50 shadow-sm'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-lg font-bold font-outfit mb-1 ${plan.highlight ? 'text-primary-foreground' : ''}`}>{plan.name}</h3>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold font-outfit">{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-primary-foreground' : 'text-primary'}`} />
                      <span className={plan.highlight ? 'text-primary-foreground/90' : ''}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard">
                  <Button
                    className={`w-full rounded-2xl ${plan.highlight ? 'bg-white text-primary hover:bg-white/90' : ''}`}
                    variant={plan.highlight ? "secondary" : "default"}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA FOOTER ──────────────────────────── */}
      <section className="py-28 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="container mx-auto max-w-3xl text-center bg-gradient-to-br from-primary/10 via-blue-500/5 to-purple-500/10 border border-primary/20 rounded-[2.5rem] p-16"
        >
          <h2 className="text-4xl font-extrabold tracking-tight font-outfit mb-4">
            Ready to win back your rankings?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Sign in with Google and generate your first report in under 3 minutes. No credit card needed.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-12 text-lg rounded-full font-semibold shadow-lg shadow-primary/20 group">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </section>

    </div>
  );
}

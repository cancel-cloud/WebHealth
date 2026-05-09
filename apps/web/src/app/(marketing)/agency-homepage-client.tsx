"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CookieSettingsButton } from "@/components/cookie-consent";
import { AgencyHeader } from "./agency-header";
import { AgencyWorkspaceDemo } from "./agency-workspace-demo";
import {
  buildLegalHref,
  LEGAL_DOCUMENT_IDS,
  LEGAL_NAV_LABELS,
} from "./legal/legal-routes";
import {
  AGENCY_COMPARISON_ROWS,
  AGENCY_FAQ_ITEMS,
  AGENCY_FEATURES,
  AGENCY_HOME_COPY,
  AGENCY_INTEGRATIONS,
  AGENCY_PILOT,
  AGENCY_PILOT_STEPS,
  AGENCY_PRICING_PLANS,
  AGENCY_QUALIFICATION,
  AGENCY_SNAPSHOT_PROOF_CARDS,
  AGENCY_STEPS,
  AGENCY_WHITE_LABEL_CHECKS,
  WHITE_LABEL_CLIENT_FIXES,
  WHITE_LABEL_INTERNAL_FIXES,
  WHITE_LABEL_KPIS,
  type IntegrationItem,
  type LandingAvailability,
} from "./agency-homepage.content";
import {
  getLocalizedValue,
  type AgencyLandingLanguage,
} from "./agency-homepage.logic";
import {
  ArrowRight,
  BarChart2,
  Check,
  ChevronDown,
  Palette,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  Zap,
  CalendarCheck2,
} from "lucide-react";

function AvailabilityBadge({
  availability,
  language,
}: {
  availability: LandingAvailability;
  language: AgencyLandingLanguage;
}) {
  const copy = {
    live: { en: "Live", de: "Live" },
    preview: { en: "Preview", de: "Preview" },
    planned: { en: "Planned", de: "Geplant" },
  } as const;

  const className =
    availability === "live"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : availability === "preview"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${className}`}
    >
      {copy[availability][language]}
    </span>
  );
}

function IntegrationLogo({ icon }: Pick<IntegrationItem, "icon">) {
  if (icon === "gsc") {
    return (
      <span className="font-display text-3xl font-black leading-none tracking-[-0.08em]" aria-hidden="true">
        <span className="text-blue-500">G</span>
      </span>
    );
  }

  if (icon === "ga4") {
    return <BarChart2 className="size-8 text-amber-500" aria-hidden="true" />;
  }

  if (icon === "looker") {
    return <BarChart2 className="size-8 text-blue-500" aria-hidden="true" />;
  }

  return <Sparkles className="size-8 text-primary" aria-hidden="true" />;
}

function FeatureIcon({ icon }: { icon: (typeof AGENCY_FEATURES)[number]["icon"] }) {
  if (icon === "users") return <Users className="size-5" aria-hidden="true" />;
  if (icon === "bar-chart-2")
    return <BarChart2 className="size-5" aria-hidden="true" />;
  if (icon === "zap") return <Zap className="size-5" aria-hidden="true" />;
  if (icon === "palette") return <Palette className="size-5" aria-hidden="true" />;
  if (icon === "calendar")
    return <CalendarCheck2 className="size-5" aria-hidden="true" />;
  return <ShieldCheck className="size-5" aria-hidden="true" />;
}

function TrendValue({
  value,
  trend,
}: {
  value: string;
  trend: "up" | "down";
}) {
  const isUp = trend === "up";
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${isUp ? "text-emerald-600" : "text-rose-600"}`}
    >
      {isUp ? (
        <TrendingUp className="size-3.5" aria-hidden="true" />
      ) : (
        <TrendingDown className="size-3.5" aria-hidden="true" />
      )}
      {value}
    </span>
  );
}

function WhiteLabelPriorityPill({ priority }: { priority: 1 | 2 | 3 }) {
  const className =
    priority === 1
      ? "bg-rose-100 text-rose-700"
      : priority === 2
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  return (
    <span
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${className}`}
    >
      P{priority}
    </span>
  );
}

export function AgencyHomepageClient({
  initialLanguage,
}: {
  initialLanguage: AgencyLandingLanguage;
}) {
  const language = initialLanguage;

  const heroTitle = getLocalizedValue(AGENCY_HOME_COPY.hero.title, language);
  const howTitle = getLocalizedValue(AGENCY_HOME_COPY.how.title, language);
  const pricingLabels = LEGAL_NAV_LABELS[language];
  const agencyPricingPlan = AGENCY_PRICING_PLANS.find((plan) => plan.tier === "agency");

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[70] focus-visible:rounded-lg focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:font-medium focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-background text-foreground">
        <AgencyHeader language={language} samePageAnchors />

        <main id="main-content" className="flex flex-col">
          <section className="relative overflow-hidden px-6 pb-18 pt-20 sm:pb-24">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(oklch(0.12 0.01 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.12 0.01 250) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="relative mx-auto grid max-w-7xl items-center gap-14 xl:grid-cols-[1.02fr_1fr]">
              <div className="max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-4 py-2 text-xs font-semibold text-primary">
                  <span className="size-2 rounded-full bg-primary" />
                  {getLocalizedValue(AGENCY_HOME_COPY.hero.pill, language)}
                </div>

                <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-6xl xl:text-7xl">
                  {heroTitle[0]}
                  <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">
                    {heroTitle[1]}
                  </span>
                  {heroTitle[2] ?? ""}
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.hero.lead, language)}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="rounded-full px-8">
                    <a href={AGENCY_PILOT.bookingUrl}>
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.primaryCta, language)}
                      <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                    </a>
                  </Button>

                  <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                    <Link href="/demo">
                      {getLocalizedValue(
                        AGENCY_HOME_COPY.hero.secondaryCta,
                        language,
                      )}
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  {language === "de"
                    ? "Die Demo zeigt, wie WebHealth SEO-Optimierung aus GSC, GA4 und Crawl-Signalen priorisiert."
                    : "The demo shows how WebHealth prioritizes SEO optimization from GSC, GA4, and crawl signals."}
                </div>

              </div>

              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-10 top-10 h-40 rounded-full blur-3xl"
                  style={{ backgroundColor: "#6366f11f" }}
                />
                <div className="relative rounded-[28px] border border-primary/20 bg-card/95 p-5 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.28)] backdrop-blur">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {getLocalizedValue(AGENCY_HOME_COPY.hero.offerTitle, language)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getLocalizedValue(AGENCY_HOME_COPY.hero.gridCount, language)}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="size-3.5" aria-hidden="true" />
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.sparkPrimary, language)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.offerTitle, language)}
                    </p>
                    <p className="mt-3 font-display text-3xl font-bold tracking-tight">
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.offerPrice, language)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.exchange, language)}
                    </p>
                    <div className="mt-5 grid gap-2 text-sm">
                      {AGENCY_PILOT_STEPS.map((step) => (
                        <div key={step.number} className="flex items-start gap-3 rounded-lg bg-muted/45 p-3">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {step.number}
                          </span>
                          <span className="font-medium">
                            {getLocalizedValue(step.title, language)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {getLocalizedValue(AGENCY_HOME_COPY.hero.sparkSecondary, language)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {language === "de"
                          ? "Gebrandeter Monats-Snapshot plus interner Maßnahmen-Backlog."
                          : "Branded monthly snapshot plus internal action backlog."}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {language === "de" ? "Founder Lock" : "Founder lock"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {getLocalizedValue(AGENCY_HOME_COPY.hero.offerLock, language)}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-border bg-muted/30 px-6 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.qualification.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.qualification.title, language)}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  {getLocalizedValue(AGENCY_HOME_COPY.qualification.lead, language)}
                </p>
              </div>

              <div className="mt-10 grid gap-4 lg:grid-cols-2">
                {AGENCY_QUALIFICATION.map((group, index) => (
                  <article
                    key={group.title.en}
                    className={`rounded-lg border bg-card p-6 shadow-sm ${
                      index === 0 ? "border-primary/25" : "border-border"
                    }`}
                  >
                    <h3 className="font-display text-xl font-semibold">
                      {getLocalizedValue(group.title, language)}
                    </h3>
                    <ul className="mt-5 space-y-3 text-sm leading-6">
                      {getLocalizedValue(group.items, language).map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          {index === 0 ? (
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                          ) : (
                            <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          )}
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="features" className="scroll-mt-24 px-6 py-24">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.features.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.features.title, language)}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  {getLocalizedValue(AGENCY_HOME_COPY.features.lead, language)}
                </p>
              </div>

              <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {AGENCY_FEATURES.map((feature) => (
                  <article
                    key={`${feature.icon}-${feature.title.en}`}
                    className="rounded-2xl border p-6"
                    style={{
                      borderColor: `${feature.color}22`,
                      backgroundColor: `${feature.color}0b`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex size-12 items-center justify-center rounded-xl border"
                        style={{
                          backgroundColor: `${feature.color}18`,
                          borderColor: `${feature.color}22`,
                          color: feature.color,
                        }}
                      >
                        <FeatureIcon icon={feature.icon} />
                      </div>
                      <AvailabilityBadge
                        availability={feature.availability}
                        language={language}
                      />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold text-balance">
                      {getLocalizedValue(feature.title, language)}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {getLocalizedValue(feature.description, language)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="demo" className="border-y border-border bg-primary/5 px-6 py-10">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {language === "de" ? "Öffentliche Demo" : "Public demo"}
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
                  {language === "de" ? "Acme Bakery im echten Dashboard ansehen" : "Open Acme Bakery in the real dashboard UI"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {language === "de"
                    ? "Sieh dir Metriken, Evidenz, SEO-Prioritäten und Snapshots direkt in der Demo an."
                    : "Explore metrics, evidence, SEO priorities, and snapshots directly in the demo."}
                </p>
              </div>
              <Button asChild className="rounded-full px-6 md:shrink-0">
                <Link href="/demo">
                  {getLocalizedValue(AGENCY_HOME_COPY.hero.secondaryCta, language)}
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </section>

          <section
            id="workspace"
            className="scroll-mt-24 border-y border-border bg-muted/30 px-6 py-24"
          >
            <div className="mx-auto max-w-7xl">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.workspace.eyebrow, language)}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                    {getLocalizedValue(AGENCY_HOME_COPY.workspace.title, language)}
                  </h2>
                </div>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  {getLocalizedValue(AGENCY_HOME_COPY.workspace.lead, language)}
                </p>
              </div>

              <AgencyWorkspaceDemo language={language} />
            </div>
          </section>

          <section className="px-6 py-24">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-3xl text-center mx-auto">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.how.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {howTitle[0]}
                  <span className="text-primary">{howTitle[1]}</span>
                  {howTitle[2] ?? ""}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  {getLocalizedValue(AGENCY_HOME_COPY.how.lead, language)}
                </p>
              </div>

              <ol className="mt-14 grid gap-8 md:grid-cols-3">
                {AGENCY_STEPS.map((step) => (
                  <li
                    key={step.number}
                    className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
                  >
                    <div
                      className="mx-auto flex size-16 items-center justify-center rounded-2xl border text-2xl font-display font-bold"
                      style={{
                        color: step.color,
                        backgroundColor: `${step.color}14`,
                        borderColor: `${step.color}28`,
                      }}
                    >
                      {step.number}
                    </div>
                    <h3 className="mt-6 font-display text-xl font-semibold text-balance">
                      {getLocalizedValue(step.title, language)}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {getLocalizedValue(step.description, language)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section
            id="whitelabel"
            className="scroll-mt-24 border-y border-border bg-muted/30 px-6 py-24"
          >
            <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_0.95fr] lg:items-center">
              <div className="relative">
                <div className="rounded-[28px] border border-border bg-card p-5 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.22)] sm:p-8">
                  <span className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.whiteLabel.internalLabel,
                      language,
                    )}
                  </span>

                  <div className="mt-5 flex items-center gap-4 border-b border-border pb-5">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-500 text-lg font-bold text-white">
                      W
                    </span>
                    <div>
                      <p className="font-display text-2xl font-bold leading-none">
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.whiteLabel.internalBrand,
                          language,
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.whiteLabel.internalSubtitle,
                          language,
                        )}
                      </p>
                    </div>
                  </div>

                  <h3 className="mt-5 font-display text-2xl font-semibold leading-tight text-balance sm:text-[2.1rem]">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.whiteLabel.internalTitle,
                      language,
                    )}
                  </h3>
                  <p className="mt-2 text-base text-muted-foreground sm:text-lg">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.whiteLabel.internalSummary,
                      language,
                    )}
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6">
                    {WHITE_LABEL_KPIS.map((kpi) => (
                      <div key={kpi.label.en}>
                        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                          {getLocalizedValue(kpi.label, language)}
                        </p>
                        <p className="mt-1 font-display text-2xl font-bold leading-none sm:text-[2.15rem]">
                          {kpi.value}
                        </p>
                        <div className="mt-1">
                          <TrendValue value={kpi.delta} trend={kpi.trend} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    {WHITE_LABEL_INTERNAL_FIXES.map((fix) => (
                      <div
                        key={`${fix.priority}-${fix.title.en}`}
                        className="flex items-center gap-3 rounded-xl bg-muted/80 px-4 py-3 text-sm"
                      >
                        <WhiteLabelPriorityPill priority={fix.priority} />
                        <p className="min-w-0 flex-1 truncate font-medium text-foreground">
                          {getLocalizedValue(fix.title, language)}
                        </p>
                        <p className="hidden shrink-0 text-sm font-medium text-muted-foreground sm:block">
                          {getLocalizedValue(fix.meta!, language)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative -mt-6 ml-4 rounded-[28px] border border-border bg-card p-5 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.22)] sm:-mt-10 sm:ml-14 sm:p-8 lg:ml-10">
                  <span className="inline-flex rounded-full bg-emerald-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.whiteLabel.clientLabel,
                      language,
                    )}
                  </span>

                  <div className="mt-5 flex items-center gap-4 border-b border-border pb-5">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 text-lg font-bold text-white">
                      A
                    </span>
                    <div>
                      <p className="font-display text-2xl font-bold leading-none">
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.whiteLabel.clientBrand,
                          language,
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.whiteLabel.clientSubtitle,
                          language,
                        )}
                      </p>
                    </div>
                  </div>

                  <h3 className="mt-5 font-display text-2xl font-semibold leading-tight text-balance sm:text-[2.1rem]">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.whiteLabel.clientTitle,
                      language,
                    )}
                  </h3>
                  <p className="mt-2 text-base text-muted-foreground sm:text-lg">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.whiteLabel.clientSummary,
                      language,
                    )}
                  </p>

                  <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-6">
                    {WHITE_LABEL_KPIS.map((kpi) => (
                      <div key={`client-${kpi.label.en}`}>
                        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                          {getLocalizedValue(kpi.label, language)}
                        </p>
                        <p className="mt-1 font-display text-2xl font-bold leading-none sm:text-[2.15rem]">
                          {kpi.value}
                        </p>
                        <div className="mt-1">
                          <TrendValue value={kpi.delta} trend={kpi.trend} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    {WHITE_LABEL_CLIENT_FIXES.map((fix) => (
                      <div
                        key={`${fix.priority}-${fix.title.en}`}
                        className="flex items-center gap-3 rounded-xl bg-muted/80 px-4 py-3 text-sm"
                      >
                        <WhiteLabelPriorityPill priority={fix.priority} />
                        <p className="min-w-0 flex-1 truncate font-medium text-foreground">
                          {getLocalizedValue(fix.title, language)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-dashed border-border pt-4 text-sm text-muted-foreground">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.whiteLabel.clientFooter,
                      language,
                    )}
                  </div>
                </div>
              </div>

              <div className="max-w-2xl lg:pl-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.whiteLabel.eyebrow, language)}
                </p>
                <h2 className="mt-4 font-display text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.whiteLabel.title, language)}
                </h2>
                <p className="mt-6 text-[1.05rem] leading-8 text-foreground/88 sm:text-[1.12rem]">
                  {getLocalizedValue(AGENCY_HOME_COPY.whiteLabel.lead, language)}
                </p>

                <div className="mt-10 space-y-8">
                  {AGENCY_WHITE_LABEL_CHECKS.map((item) => (
                    <div key={item.title.en} className="flex gap-4">
                      <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-foreground">
                        <Check className="size-4.5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-display text-[1.05rem] font-bold text-foreground sm:text-[1.15rem]">
                          {getLocalizedValue(item.title, language)}
                        </p>
                        <p className="mt-2 text-[1.02rem] leading-8 text-muted-foreground">
                          {getLocalizedValue(item.description, language)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="integrations" className="scroll-mt-24 bg-background px-6 py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-4xl text-center">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.integrations.eyebrow, language)}
                </p>
                <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-foreground text-balance sm:text-6xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.integrations.title, language)}
                </h2>
                <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-muted-foreground sm:text-2xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.integrations.lead, language)}
                </p>
              </div>

              <div className="mt-12 grid items-center gap-8 sm:mt-16 sm:gap-12 lg:grid-cols-[minmax(0,0.98fr)_minmax(420px,1fr)]">
                <div className="grid gap-3">
                  {AGENCY_INTEGRATIONS.map((integration) => (
                    <article
                      key={integration.title.en}
                      className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.34)] sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="flex gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                          <IntegrationLogo icon={integration.icon} />
                        </div>
                        <div>
                          <h3 className="font-display text-2xl font-semibold tracking-[-0.02em]">
                            {getLocalizedValue(integration.title, language)}
                          </h3>
                          <p className="mt-1.5 max-w-2xl text-base leading-7 text-muted-foreground">
                            {getLocalizedValue(integration.description, language)}
                          </p>
                        </div>
                      </div>
                      <AvailabilityBadge
                        availability={integration.availability}
                        language={language}
                      />
                    </article>
                  ))}
                </div>

                <div className="relative min-h-[260px] overflow-hidden sm:min-h-[360px] lg:min-h-[500px]">
                  <div className="absolute left-1/2 top-1/2 flex size-28 -tranzinc-x-1/2 -tranzinc-y-1/2 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#3154f4,#1597e5)] shadow-[0_34px_80px_-28px_rgba(49,84,244,0.65)] sm:h-36 sm:w-36 sm:rounded-[2rem] lg:h-40 lg:w-40">
                    <div className="size-11 rounded-full bg-background sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
                  </div>

                  <div className="absolute left-[58%] top-3 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.15rem] border border-border bg-card text-blue-500 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] sm:top-6 sm:h-[5.5rem] sm:w-[5.5rem] sm:rounded-[1.35rem] lg:top-8 lg:h-24 lg:w-24 lg:rounded-[1.5rem]">
                    <IntegrationLogo icon="gsc" />
                  </div>
                  <div className="absolute right-1 top-[43%] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.15rem] border border-border bg-card text-amber-500 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] sm:right-2 sm:h-[5.5rem] sm:w-[5.5rem] sm:rounded-[1.35rem] lg:h-24 lg:w-24 lg:rounded-[1.5rem]">
                    <IntegrationLogo icon="ga4" />
                  </div>
                  <div className="absolute bottom-3 left-[58%] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.15rem] border border-border bg-card text-blue-500 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] sm:bottom-6 sm:h-[5.5rem] sm:w-[5.5rem] sm:rounded-[1.35rem] lg:bottom-8 lg:h-24 lg:w-24 lg:rounded-[1.5rem]">
                    <IntegrationLogo icon="looker" />
                  </div>
                  <div className="absolute bottom-[36%] left-[18%] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.15rem] border border-border bg-card text-primary shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] sm:left-[22%] sm:h-[5.5rem] sm:w-[5.5rem] sm:rounded-[1.35rem] lg:h-24 lg:w-24 lg:rounded-[1.5rem]">
                    <IntegrationLogo icon="crawl" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-background px-6 py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.snapshotProof.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.snapshotProof.title, language)}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  {getLocalizedValue(AGENCY_HOME_COPY.snapshotProof.lead, language)}
                </p>
              </div>

              <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {AGENCY_SNAPSHOT_PROOF_CARDS.map((card) => (
                  <article key={card.title.en} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Check className="size-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold">
                      {getLocalizedValue(card.title, language)}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {getLocalizedValue(card.description, language)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-border bg-muted/30 px-6 py-20">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.competitor.eyebrow, language)}
                </p>
                <h2 className="mt-3 max-w-full break-words font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.competitor.title, language)}
                </h2>
              </div>
              <p className="min-w-0 max-w-full break-words text-base leading-8 text-muted-foreground sm:text-lg">
                {getLocalizedValue(AGENCY_HOME_COPY.competitor.lead, language)}
              </p>
            </div>
          </section>

          <section className="border-y border-border bg-muted/30 px-6 py-24">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.comparison.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.comparison.title, language)}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  {getLocalizedValue(AGENCY_HOME_COPY.comparison.lead, language)}
                </p>
              </div>

              <div className="mt-12 grid gap-4 sm:hidden">
                {AGENCY_COMPARISON_ROWS.map((row) => (
                  <article
                    key={row.label.en}
                    className="rounded-[24px] border border-border bg-card p-5 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)]"
                  >
                    <h3 className="font-display text-base font-semibold leading-6 text-foreground">
                      {getLocalizedValue(row.label, language)}
                    </h3>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-lg bg-muted/45 p-4">
                        <p className="font-display text-sm font-medium text-muted-foreground">
                          {getLocalizedValue(
                            AGENCY_HOME_COPY.comparison.manualLabel,
                            language,
                          )}
                        </p>
                        <span className="mt-2 inline-flex items-start gap-3 text-sm font-medium leading-6 text-muted-foreground">
                          <X
                            className="mt-1 h-[18px] w-[18px] shrink-0 text-[oklch(0.55_0.02_250)]"
                            aria-hidden="true"
                          />
                          <span>{getLocalizedValue(row.manual, language)}</span>
                        </span>
                      </div>
                      <div className="rounded-lg border border-primary/15 bg-primary/8 p-4">
                        <p className="font-display text-sm font-bold text-primary">
                          {getLocalizedValue(
                            AGENCY_HOME_COPY.comparison.webhealthLabel,
                            language,
                          )}
                        </p>
                        <span className="mt-2 inline-flex items-start gap-3 text-sm font-semibold leading-6 text-foreground">
                          <Check
                            className="mt-1 h-[18px] w-[18px] shrink-0 text-foreground"
                            aria-hidden="true"
                          />
                          <span>{getLocalizedValue(row.webhealth, language)}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-12 hidden overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)] sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/45">
                        <th className="w-[28%] px-6 py-5 text-left" />
                        <th className="px-6 py-5 text-left font-display text-[15px] font-medium text-muted-foreground">
                          {getLocalizedValue(
                            AGENCY_HOME_COPY.comparison.manualLabel,
                            language,
                          )}
                        </th>
                        <th className="px-6 py-5 text-left font-display text-[15px] font-bold text-primary">
                          {getLocalizedValue(
                            AGENCY_HOME_COPY.comparison.webhealthLabel,
                            language,
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {AGENCY_COMPARISON_ROWS.map((row) => (
                        <tr
                          key={row.label.en}
                          className="border-b border-border last:border-b-0"
                        >
                          <td className="px-6 py-5 align-top text-[15px] font-semibold leading-7 text-foreground">
                            {getLocalizedValue(row.label, language)}
                          </td>
                          <td className="px-6 py-5 align-top text-[15px] leading-7 text-muted-foreground">
                            <span className="inline-flex items-start gap-3 font-medium">
                              <X
                                className="mt-1 h-[18px] w-[18px] shrink-0 text-[oklch(0.55_0.02_250)]"
                                aria-hidden="true"
                              />
                              <span>{getLocalizedValue(row.manual, language)}</span>
                            </span>
                          </td>
                          <td className="px-6 py-5 align-top text-[15px] leading-7 text-foreground">
                            <span className="inline-flex items-start gap-3 font-semibold">
                              <Check
                                className="mt-1 h-[18px] w-[18px] shrink-0 text-foreground"
                                aria-hidden="true"
                              />
                              <span>{getLocalizedValue(row.webhealth, language)}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section id="pricing" className="scroll-mt-24 px-6 py-24">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.pricing.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.pricing.title, language)}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  {getLocalizedValue(AGENCY_HOME_COPY.pricing.lead, language)}
                </p>
              </div>

              <div className="mt-12 rounded-lg border border-primary/25 bg-card p-6 shadow-[0_18px_55px_-32px_rgba(99,102,241,0.45)]">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.offerTitle, language)}
                    </div>
                    <h3 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.offerPrice, language)}
                    </h3>
                    <p className="mt-4 text-base leading-7 text-muted-foreground">
                      {getLocalizedValue(AGENCY_HOME_COPY.features.lead, language)}
                    </p>
                    <p className="mt-4 rounded-lg border border-border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.exchange, language)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-5">
                    <p className="text-sm font-semibold text-foreground">
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.offerLimit, language)}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.offerLock, language)}
                    </p>
                    <ul className="mt-5 space-y-3 text-sm">
                      {AGENCY_PILOT_STEPS.map((step) => (
                        <li key={step.number} className="flex items-start gap-3">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {step.number}
                          </span>
                          <span>{getLocalizedValue(step.title, language)}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-6 h-11 w-full rounded-full">
                      <a href={AGENCY_PILOT.bookingUrl}>
                        {getLocalizedValue(AGENCY_HOME_COPY.hero.primaryCta, language)}
                        <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-14">
                <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {getLocalizedValue(AGENCY_HOME_COPY.pricing.selfServeLabel, language)}
                </p>
              </div>

              <div className="mt-6 grid items-stretch justify-items-center gap-5 md:grid-cols-3 lg:justify-items-stretch">
                {AGENCY_PRICING_PLANS.filter((plan) => plan.tier !== "agency").map((plan) => (
                  <article
                    key={plan.tier}
                    className={`flex size-full max-w-[29rem] flex-col rounded-lg border bg-card p-5 shadow-sm md:max-w-[23.5rem] lg:max-w-none lg:self-stretch ${
                      plan.highlight
                        ? "border-primary shadow-[0_16px_50px_-28px_rgba(99,102,241,0.35)]"
                        : "border-border"
                    }`}
                  >
                    <div className="min-h-8">
                      {plan.badge ? (
                        <span className="inline-flex w-fit items-center rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                          {getLocalizedValue(plan.badge, language)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 min-h-[5.5rem]">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
                          {getLocalizedValue(plan.name, language)}
                        </h3>
                      </div>

                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {getLocalizedValue(plan.description, language)}
                      </p>
                    </div>

                    <div className="flex items-end gap-2">
                      <span className="font-display text-4xl font-bold">
                        {getLocalizedValue(plan.price, language)}
                      </span>
                      <span className="pb-1 text-sm text-muted-foreground">
                        {getLocalizedValue(plan.period, language)}
                      </span>
                    </div>

                    <div className="mt-2 min-h-7">
                      {plan.note ? (
                        <p className="text-xs text-muted-foreground">
                          {getLocalizedValue(plan.note, language)}
                        </p>
                      ) : null}
                    </div>

                    <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature.en} className="flex items-start gap-3">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{getLocalizedValue(feature, language)}</span>
                        </li>
                      ))}
                      </ul>

                    <Button asChild className="mt-8 h-10 w-full rounded-full">
                      <Link href="/dashboard">{getLocalizedValue(plan.cta, language)}</Link>
                    </Button>
                  </article>
                ))}
              </div>

              {agencyPricingPlan ? (
                <article className="mt-6 rounded-lg border border-border bg-card p-6 shadow-sm">
                  <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
                        {getLocalizedValue(agencyPricingPlan.name, language)}
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                        {getLocalizedValue(agencyPricingPlan.description, language)}
                      </p>
                      {agencyPricingPlan.note ? (
                        <p className="mt-3 text-sm font-semibold text-foreground">
                          {getLocalizedValue(agencyPricingPlan.note, language)}
                        </p>
                      ) : null}
                    </div>
                    <div className="md:min-w-56">
                      <div className="flex items-end gap-2">
                        <span className="font-display text-4xl font-bold">
                          {getLocalizedValue(agencyPricingPlan.price, language)}
                        </span>
                        <span className="pb-1 text-sm text-muted-foreground">
                          {getLocalizedValue(agencyPricingPlan.period, language)}
                        </span>
                      </div>
                      <Button asChild className="mt-4 h-10 w-full rounded-full">
                        <a href="mailto:kontakt@devbrew.dev?subject=Webhealth%20Agency%20Interest">
                          {getLocalizedValue(agencyPricingPlan.cta, language)}
                        </a>
                      </Button>
                    </div>
                  </div>

                  <ul className="mt-6 grid gap-3 text-sm md:grid-cols-2">
                    {agencyPricingPlan.features.map((feature) => (
                      <li key={feature.en} className="flex items-start gap-3">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        <span>{getLocalizedValue(feature, language)}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ) : null}

            </div>
          </section>

          <section
            id="faq"
            className="scroll-mt-24 border-y border-border bg-muted/30 px-6 py-24"
          >
            <div className="mx-auto max-w-5xl">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.faq.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.faq.title, language)}
                </h2>
              </div>

              <div className="mt-12 space-y-4">
                {AGENCY_FAQ_ITEMS.map((item, index) => (
                  <details
                    key={item.question.en}
                    className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-sm"
                    open={index === 0}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-display text-xl font-semibold">
                      <span>{getLocalizedValue(item.question, language)}</span>
                      <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="pt-4 text-sm leading-7 text-muted-foreground">
                      {getLocalizedValue(item.answer, language)}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden px-6 py-24">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(circle_at_left,_rgba(99,102,241,0.11),_transparent_40%),radial-gradient(circle_at_right,_rgba(14,165,233,0.11),_transparent_42%)]"
            />
            <div className="relative mx-auto max-w-3xl text-center">
              <h2 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                {getLocalizedValue(AGENCY_HOME_COPY.closingCta.title, language)}
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {getLocalizedValue(AGENCY_HOME_COPY.closingCta.subtitle, language)}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-8">
                  <a href={AGENCY_PILOT.bookingUrl}>
                    {getLocalizedValue(AGENCY_HOME_COPY.closingCta.primaryCta, language)}
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </a>
                </Button>

                <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                  <Link href="/dashboard">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.closingCta.secondaryCta,
                      language,
                    )}
                  </Link>
                </Button>
              </div>

            </div>
          </section>
        </main>

        <footer className="border-t border-border bg-muted/30 px-6 py-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-display font-bold text-foreground">Webhealth</span>
              <span>
                &copy; {new Date().getFullYear()} DevBrew.{" "}
                {getLocalizedValue(AGENCY_HOME_COPY.footer.rights, language)}
              </span>
            </div>

            <nav
              className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
              aria-label="Homepage footer navigation"
            >
              <a href="#pricing" className="transition-colors hover:text-foreground">
                {getLocalizedValue(AGENCY_HOME_COPY.footer.pricing, language)}
              </a>
              {LEGAL_DOCUMENT_IDS.map((documentId) => (
                <Link
                  key={documentId}
                  href={buildLegalHref(documentId, language)}
                  className="transition-colors hover:text-foreground"
                >
                  {pricingLabels[documentId]}
                </Link>
              ))}
              <CookieSettingsButton />
              <a
                href="mailto:kontakt@devbrew.dev"
                className="transition-colors hover:text-foreground"
              >
                {getLocalizedValue(AGENCY_HOME_COPY.footer.contact, language)}
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}

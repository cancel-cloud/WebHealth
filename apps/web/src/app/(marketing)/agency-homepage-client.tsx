"use client";

import Link from "next/link";
import { useReducer, useState } from "react";
import { authClient } from "@webhealth/shared/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CookieSettingsButton } from "@/components/cookie-consent";
import { ThemeToggle } from "@/components/theme-toggle";
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
  AGENCY_PRICING_PLANS,
  AGENCY_STEPS,
  AGENCY_WHITE_LABEL_CHECKS,
  AGENCY_WORKSPACE_CLIENTS,
  WHITE_LABEL_CLIENT_FIXES,
  WHITE_LABEL_INTERNAL_FIXES,
  WHITE_LABEL_KPIS,
  type IntegrationItem,
  type LandingAvailability,
} from "./agency-homepage.content";
import {
  clampAgencySites,
  DEFAULT_AGENCY_LANGUAGE,
  DEFAULT_AGENCY_SITE_COUNT,
  getAgencyPrice,
  getDefaultWorkspaceSelection,
  getLocalizedValue,
  getNextWorkspaceSelection,
  type AgencyLandingLanguage,
  type WorkspaceAction,
  type WorkspaceSelection,
} from "./agency-homepage.logic";
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Check,
  ChevronDown,
  LayoutGrid,
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

const NAV_ITEMS = [
  { id: "workspace", key: "workspace" },
  { id: "whitelabel", key: "whiteLabel" },
  { id: "integrations", key: "integrations" },
  { id: "pricing", key: "pricing" },
  { id: "faq", key: "faq" },
] as const;

function workspaceReducer(
  state: WorkspaceSelection,
  action: WorkspaceAction,
): WorkspaceSelection {
  return getNextWorkspaceSelection(
    state,
    action,
    AGENCY_WORKSPACE_CLIENTS.length,
  );
}

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
    return <BarChart2 className="h-8 w-8 text-amber-500" aria-hidden="true" />;
  }

  if (icon === "looker") {
    return <BarChart2 className="h-8 w-8 text-blue-500" aria-hidden="true" />;
  }

  return <Sparkles className="h-8 w-8 text-indigo-500" aria-hidden="true" />;
}

function FeatureIcon({ icon }: { icon: (typeof AGENCY_FEATURES)[number]["icon"] }) {
  if (icon === "users") return <Users className="h-5 w-5" aria-hidden="true" />;
  if (icon === "bar-chart-2")
    return <BarChart2 className="h-5 w-5" aria-hidden="true" />;
  if (icon === "zap") return <Zap className="h-5 w-5" aria-hidden="true" />;
  if (icon === "palette") return <Palette className="h-5 w-5" aria-hidden="true" />;
  if (icon === "calendar")
    return <CalendarCheck2 className="h-5 w-5" aria-hidden="true" />;
  return <ShieldCheck className="h-5 w-5" aria-hidden="true" />;
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
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
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
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${className}`}
    >
      P{priority}
    </span>
  );
}

export function AgencyHomepageClient() {
  const [language, setLanguage] = useState(DEFAULT_AGENCY_LANGUAGE);
  const [agencySiteCount, setAgencySiteCount] = useState(DEFAULT_AGENCY_SITE_COUNT);
  const [workspaceSelection, dispatchWorkspace] = useReducer(
    workspaceReducer,
    undefined,
    getDefaultWorkspaceSelection,
  );
  const { data: session, isPending } = authClient.useSession();

  const heroTitle = getLocalizedValue(AGENCY_HOME_COPY.hero.title, language);
  const howTitle = getLocalizedValue(AGENCY_HOME_COPY.how.title, language);
  const currentAgencyPrice = getAgencyPrice(agencySiteCount);
  const pricingLabels = LEGAL_NAV_LABELS[language];

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[70] focus-visible:rounded-lg focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:font-medium focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-50 border-b border-primary/20 bg-primary/10 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-2 font-display text-lg font-extrabold tracking-tight sm:text-xl"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-sky-500 shadow-lg shadow-primary/20">
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
              </span>
              <span className="min-w-0 truncate">
                Webhealth{" "}
                <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                  {getLocalizedValue(AGENCY_HOME_COPY.brandSuffix, language)}
                </span>
              </span>
            </Link>

            <nav
              className="hidden items-center gap-5 lg:flex"
              aria-label="Agency landing navigation"
            >
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {getLocalizedValue(AGENCY_HOME_COPY.nav[item.key], language)}
                </a>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div
                className="inline-flex rounded-full border border-border bg-card/75 p-1"
                role="group"
                aria-label="Language toggle"
              >
                {(["en", "de"] as const).map((nextLanguage) => (
                  <button
                    key={nextLanguage}
                    type="button"
                    onClick={() => setLanguage(nextLanguage)}
                    className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors sm:px-3 ${
                      nextLanguage === language
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {nextLanguage.toUpperCase()}
                  </button>
                ))}
              </div>

              {isPending ? (
                <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
              ) : session ? (
                <Button asChild variant="ghost" className="rounded-full">
                  <Link href="/dashboard">
                    {getLocalizedValue(AGENCY_HOME_COPY.nav.dashboard, language)}
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="rounded-full px-3 shadow-sm shadow-primary/20 sm:px-5"
                  aria-label={getLocalizedValue(AGENCY_HOME_COPY.nav.signIn, language)}
                >
                  <span className="sm:hidden">
                    {language === "de" ? "Anmelden" : "Sign in"}
                  </span>
                  <span className="hidden sm:inline">
                    {getLocalizedValue(AGENCY_HOME_COPY.nav.signIn, language)}
                  </span>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

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
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {getLocalizedValue(AGENCY_HOME_COPY.hero.pill, language)}
                </div>

                <h1 className="max-w-3xl font-display text-5xl font-extrabold tracking-tight text-balance sm:text-6xl lg:text-6xl xl:text-7xl">
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
                  {session ? (
                    <Button asChild size="lg" className="rounded-full px-8">
                      <Link href="/dashboard">
                        {getLocalizedValue(
                          AGENCY_HOME_COPY.nav.dashboard,
                          language,
                        )}
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      className="rounded-full px-8"
                      onClick={handleGoogleSignIn}
                    >
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.primaryCta, language)}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}

                  <Button asChild variant="ghost" size="lg" className="rounded-full px-8">
                    <a href="#workspace">
                      {getLocalizedValue(
                        AGENCY_HOME_COPY.hero.secondaryCta,
                        language,
                      )}
                    </a>
                  </Button>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {getLocalizedValue(AGENCY_HOME_COPY.hero.notes, language).map(
                    (note) => (
                      <span key={note} className="inline-flex items-center gap-3">
                        <span>{note}</span>
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-10 top-10 h-40 rounded-full blur-3xl"
                  style={{ backgroundColor: "#6366f11f" }}
                />
                <div className="relative rounded-[28px] border border-border bg-card/90 p-5 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.28)] backdrop-blur">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {getLocalizedValue(AGENCY_HOME_COPY.hero.gridTitle, language)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getLocalizedValue(AGENCY_HOME_COPY.hero.gridCount, language)}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.sparkPrimary, language)}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {AGENCY_WORKSPACE_CLIENTS.map((client) => (
                      <article
                        key={client.domain}
                        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                            style={{ background: client.badgeGradient }}
                          >
                            {client.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {client.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {client.domain}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-muted/55 p-3">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              Clicks
                            </p>
                            <p className="mt-1 font-display text-xl font-bold">
                              {client.clicks}
                            </p>
                            <TrendValue
                              value={client.clicksDelta}
                              trend={client.clicksTrend}
                            />
                          </div>
                          <div className="rounded-xl bg-muted/55 p-3">
                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              CTR
                            </p>
                            <p className="mt-1 font-display text-xl font-bold">
                              {client.ctr}
                            </p>
                            <TrendValue
                              value={client.ctrDelta}
                              trend={client.ctrTrend}
                            />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {getLocalizedValue(AGENCY_HOME_COPY.hero.sparkPrimary, language)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      {getLocalizedValue(
                        AGENCY_HOME_COPY.hero.sparkSecondary,
                        language,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="scroll-mt-24 px-6 py-24">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.features.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
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
                        className="flex h-12 w-12 items-center justify-center rounded-xl border"
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
                  <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                    {getLocalizedValue(AGENCY_HOME_COPY.workspace.title, language)}
                  </h2>
                  <AvailabilityBadge availability="preview" language={language} />
                </div>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  {getLocalizedValue(AGENCY_HOME_COPY.workspace.lead, language)}
                </p>
              </div>

              <div className="mt-12 overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_24px_60px_-32px_rgba(15,23,42,0.26)]">
                <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-300" />
                      <span className="h-3 w-3 rounded-full bg-amber-300" />
                      <span className="h-3 w-3 rounded-full bg-emerald-300" />
                    </div>
                    <span className="rounded-full border border-border bg-muted/55 px-3 py-1 text-xs font-medium text-muted-foreground">
                      app.webhealth.dev/agency/devbrew
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {getLocalizedValue(AGENCY_HOME_COPY.workspace.teamLabel, language)}
                  </span>
                </div>

                <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
                  <aside className="border-r border-border bg-muted/30 p-4">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {getLocalizedValue(
                        AGENCY_HOME_COPY.workspace.clientsLabel,
                        language,
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() => dispatchWorkspace({ type: "show_portfolio" })}
                      className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        workspaceSelection.view === "portfolio"
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                      {getLocalizedValue(
                        AGENCY_HOME_COPY.workspace.portfolioLabel,
                        language,
                      )}
                    </button>

                    <div className="space-y-2">
                      {AGENCY_WORKSPACE_CLIENTS.map((client, index) => {
                        const isActive =
                          workspaceSelection.view === "client" &&
                          workspaceSelection.index === index;

                        return (
                          <button
                            key={client.domain}
                            type="button"
                            onClick={() =>
                              dispatchWorkspace({
                                type: "show_client",
                                index,
                              })
                            }
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                              isActive
                                ? "bg-primary/10 text-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                              style={{ background: client.badgeGradient }}
                            >
                              {client.initials}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {client.name}
                              </span>
                              <span className="block text-xs">
                                {client.openFixes}{" "}
                                {getLocalizedValue(
                                  AGENCY_HOME_COPY.workspace.openFixesLabel,
                                  language,
                                )}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
                      +{" "}
                      {getLocalizedValue(
                        AGENCY_HOME_COPY.workspace.addClientLabel,
                        language,
                      )}
                    </div>
                  </aside>

                  <div className="p-5 sm:p-6">
                    {workspaceSelection.view === "portfolio" ? (
                      <>
                        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <h3 className="font-display text-2xl font-bold">
                              {getLocalizedValue(
                                AGENCY_HOME_COPY.workspace.portfolioTitle,
                                language,
                              )}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {getLocalizedValue(
                                AGENCY_HOME_COPY.workspace.portfolioSubtitle,
                                language,
                              )}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.values(AGENCY_HOME_COPY.workspace.filters).map(
                              (filterLabel, index) => (
                                <span
                                  key={filterLabel.en}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                                    index === 0
                                      ? "border-primary/20 bg-primary/10 text-foreground"
                                      : "border-border bg-muted/50 text-muted-foreground"
                                  }`}
                                >
                                  {getLocalizedValue(filterLabel, language)}
                                </span>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="mt-6 grid gap-4 xl:grid-cols-2">
                          {AGENCY_WORKSPACE_CLIENTS.map((client, index) => (
                            <button
                              key={client.domain}
                              type="button"
                              onClick={() =>
                                dispatchWorkspace({ type: "show_client", index })
                              }
                              className="rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <span
                                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                                    style={{ background: client.badgeGradient }}
                                  >
                                    {client.initials}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-foreground">
                                      {client.name}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {client.domain}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                    client.status === "healthy"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : client.status === "attention"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {getLocalizedValue(client.statusLabel, language)}
                                </span>
                              </div>

                              <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-muted/55 p-3">
                                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                                    Clicks
                                  </p>
                                  <p className="mt-1 font-display text-xl font-bold">
                                    {client.clicks}
                                  </p>
                                  <TrendValue
                                    value={client.clicksDelta}
                                    trend={client.clicksTrend}
                                  />
                                </div>
                                <div className="rounded-xl bg-muted/55 p-3">
                                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                                    CTR
                                  </p>
                                  <p className="mt-1 font-display text-xl font-bold">
                                    {client.ctr}
                                  </p>
                                  <TrendValue
                                    value={client.ctrDelta}
                                    trend={client.ctrTrend}
                                  />
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {getLocalizedValue(
                                    AGENCY_HOME_COPY.workspace.openFixesLabel,
                                    language,
                                  )}
                                  :{" "}
                                  <strong className="text-foreground">
                                    {client.openFixes}
                                  </strong>
                                </span>
                                <span className="font-semibold text-primary">
                                  {getLocalizedValue(
                                    AGENCY_HOME_COPY.workspace.openDetailsLabel,
                                    language,
                                  )}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      (() => {
                        const client =
                          AGENCY_WORKSPACE_CLIENTS[workspaceSelection.index];
                        return (
                          <>
                            <div className="flex flex-col gap-4 border-b border-border pb-5">
                              <button
                                type="button"
                                onClick={() =>
                                  dispatchWorkspace({ type: "show_portfolio" })
                                }
                                className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                              >
                                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                {getLocalizedValue(
                                  AGENCY_HOME_COPY.workspace.backLabel,
                                  language,
                                )}
                              </button>
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                                      style={{ background: client.badgeGradient }}
                                    >
                                      {client.initials}
                                    </span>
                                    <h3 className="font-display text-2xl font-bold">
                                      {client.name}
                                    </h3>
                                  </div>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {client.domain} ·{" "}
                                    {getLocalizedValue(client.reportLabel, language)}
                                  </p>
                                </div>
                                <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                                  {getLocalizedValue(
                                    AGENCY_HOME_COPY.workspace.reportPreviewLabel,
                                    language,
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 grid gap-4 xl:grid-cols-4">
                              {[
                                {
                                  label: "Clicks",
                                  value: client.clicks,
                                  delta: client.clicksDelta,
                                  trend: client.clicksTrend,
                                },
                                {
                                  label: "CTR",
                                  value: client.ctr,
                                  delta: client.ctrDelta,
                                  trend: client.ctrTrend,
                                },
                                {
                                  label:
                                    language === "en"
                                      ? "Impressions"
                                      : "Impressionen",
                                  value: client.impressions,
                                  delta: client.impressionsDelta,
                                  trend: client.impressionsTrend,
                                },
                                {
                                  label:
                                    language === "en"
                                      ? "Avg. position"
                                      : "Ø Position",
                                  value: client.position,
                                  delta: client.positionDelta,
                                  trend: client.positionTrend,
                                },
                              ].map((metric) => (
                                <div
                                  key={metric.label}
                                  className="rounded-2xl border border-border bg-muted/40 p-4"
                                >
                                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                                    {metric.label}
                                  </p>
                                  <p className="mt-2 font-display text-3xl font-bold">
                                    {metric.value}
                                  </p>
                                  <div className="mt-2">
                                    <TrendValue
                                      value={metric.delta}
                                      trend={metric.trend}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                                <h4 className="font-display text-xl font-semibold">
                                  {getLocalizedValue(
                                    AGENCY_HOME_COPY.workspace.prioritisedFixesLabel,
                                    language,
                                  )}
                                </h4>
                                <span className="rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
                                  {client.openFixes}{" "}
                                  {getLocalizedValue(
                                    AGENCY_HOME_COPY.workspace.openFixesLabel,
                                    language,
                                  )}
                                </span>
                              </div>

                              <div className="mt-4 space-y-3">
                                {client.fixList.map((fix) => (
                                  <div
                                    key={`${fix.url}-${fix.priority}`}
                                    className="grid gap-3 rounded-2xl border border-border px-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-start"
                                  >
                                    <span
                                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                        fix.priority === 1
                                          ? "bg-rose-100 text-rose-700"
                                          : fix.priority === 2
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-emerald-100 text-emerald-700"
                                      }`}
                                    >
                                      P{fix.priority}
                                    </span>
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {getLocalizedValue(fix.title, language)}
                                      </p>
                                      <p className="mt-1 break-all text-xs text-muted-foreground">
                                        {fix.url}
                                      </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                      <p className="font-display text-lg font-bold text-primary">
                                        {fix.impact}
                                      </p>
                                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                                        {getLocalizedValue(
                                          AGENCY_HOME_COPY.workspace.estimatedClicksLabel,
                                          language,
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 py-24">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-3xl text-center mx-auto">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.how.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
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
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border text-2xl font-display font-bold"
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
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-sky-500 text-lg font-bold text-white">
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

                  <h3 className="mt-5 font-display text-2xl font-bold leading-tight text-balance sm:text-[2.1rem]">
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
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 text-lg font-bold text-white">
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

                  <h3 className="mt-5 font-display text-2xl font-bold leading-tight text-balance sm:text-[2.1rem]">
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
                <h2 className="mt-4 font-display text-5xl font-bold tracking-tight text-balance sm:text-6xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.whiteLabel.title, language)}
                </h2>
                <p className="mt-6 text-[1.05rem] leading-8 text-foreground/88 sm:text-[1.12rem]">
                  {getLocalizedValue(AGENCY_HOME_COPY.whiteLabel.lead, language)}
                </p>

                <div className="mt-10 space-y-8">
                  {AGENCY_WHITE_LABEL_CHECKS.map((item) => (
                    <div key={item.title.en} className="flex gap-4">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-foreground text-foreground">
                        <Check className="h-4.5 w-4.5" aria-hidden="true" />
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
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-indigo-500">
                  {getLocalizedValue(AGENCY_HOME_COPY.integrations.eyebrow, language)}
                </p>
                <h2 className="mt-5 font-display text-4xl font-black leading-[1.02] tracking-[-0.04em] text-foreground text-balance sm:text-6xl">
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
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                          <IntegrationLogo icon={integration.icon} />
                        </div>
                        <div>
                          <h3 className="font-display text-2xl font-black tracking-[-0.02em]">
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
                  <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,#3154f4,#1597e5)] shadow-[0_34px_80px_-28px_rgba(49,84,244,0.65)] sm:h-36 sm:w-36 sm:rounded-[2rem] lg:h-40 lg:w-40">
                    <div className="h-11 w-11 rounded-full bg-background sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
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
                  <div className="absolute bottom-[36%] left-[18%] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.15rem] border border-border bg-card text-indigo-500 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45)] sm:left-[22%] sm:h-[5.5rem] sm:w-[5.5rem] sm:rounded-[1.35rem] lg:h-24 lg:w-24 lg:rounded-[1.5rem]">
                    <IntegrationLogo icon="crawl" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-border bg-muted/30 px-6 py-24">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {getLocalizedValue(AGENCY_HOME_COPY.comparison.eyebrow, language)}
                </p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
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
                    <h3 className="font-display text-base font-bold leading-6 text-foreground">
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
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                  {getLocalizedValue(AGENCY_HOME_COPY.pricing.title, language)}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                  {getLocalizedValue(AGENCY_HOME_COPY.pricing.lead, language)}
                </p>
              </div>

              <div className="mt-12 grid items-start justify-items-center gap-5 md:grid-cols-2 xl:grid-cols-4 xl:justify-items-stretch 2xl:items-stretch">
                {AGENCY_PRICING_PLANS.map((plan) => (
                  <article
                    key={plan.tier}
                    className={`flex w-full max-w-[29rem] flex-col rounded-[28px] border bg-card p-6 shadow-sm md:max-w-[23.5rem] xl:max-w-none 2xl:h-full 2xl:self-stretch ${
                      plan.highlight
                        ? "border-primary shadow-[0_16px_50px_-28px_rgba(99,102,241,0.35)]"
                        : "border-border"
                    }`}
                  >
                    {plan.badge ? (
                      <span className="mb-4 inline-flex w-fit items-center rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary-foreground">
                        {getLocalizedValue(plan.badge, language)}
                      </span>
                    ) : null}

                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
                        {getLocalizedValue(plan.name, language)}
                      </h3>
                      {plan.tier === "agency" ? (
                        <AvailabilityBadge availability="preview" language={language} />
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {getLocalizedValue(plan.description, language)}
                    </p>

                    {plan.tier === "agency" ? (
                      <div className="mt-8">
                        <div className="flex items-end gap-2">
                          <span className="font-display text-5xl font-bold">
                            €{currentAgencyPrice}
                          </span>
                          <span className="pb-1 text-sm text-muted-foreground">
                            {getLocalizedValue(plan.period, language)}
                          </span>
                        </div>
                        <div className="mt-4 rounded-2xl border border-border bg-muted/35 p-4">
                          <div className="flex items-center justify-between gap-3 text-sm font-medium">
                            <span>
                              {getLocalizedValue(
                                AGENCY_HOME_COPY.pricing.agencySitesLabel,
                                language,
                              )}
                            </span>
                            <span>{agencySiteCount}</span>
                          </div>
                          <input
                            aria-label={getLocalizedValue(
                              AGENCY_HOME_COPY.pricing.agencySitesLabel,
                              language,
                            )}
                            type="range"
                            min={26}
                            max={200}
                            value={agencySiteCount}
                            onChange={(event) =>
                              setAgencySiteCount(
                                clampAgencySites(Number(event.target.value)),
                              )
                            }
                            className="mt-4 w-full accent-primary"
                          />
                          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                            <span>26</span>
                            <span>50</span>
                            <span>100</span>
                            <span>200+</span>
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground">
                            {getLocalizedValue(
                              AGENCY_HOME_COPY.pricing.agencyPreviewLabel,
                              language,
                            )}{" "}
                            · {getLocalizedValue(plan.note!, language)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 flex items-end gap-2">
                        <span className="font-display text-5xl font-bold">
                          {getLocalizedValue(plan.price, language)}
                        </span>
                        <span className="pb-1 text-sm text-muted-foreground">
                          {getLocalizedValue(plan.period, language)}
                        </span>
                      </div>
                    )}

                    <ul className="mt-8 space-y-3 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature.en} className="flex items-start gap-3">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{getLocalizedValue(feature, language)}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.tier === "agency" ? (
                      <Button asChild variant="outline" className="mt-6 rounded-full 2xl:mt-auto">
                        <a href="mailto:kontakt@devbrew.dev?subject=Webhealth%20Agency%20Interest">
                          {getLocalizedValue(plan.cta, language)}
                        </a>
                      </Button>
                    ) : session ? (
                      <Button asChild className="mt-6 rounded-full 2xl:mt-auto">
                        <Link href="/dashboard">{getLocalizedValue(plan.cta, language)}</Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="mt-6 rounded-full 2xl:mt-auto"
                        onClick={handleGoogleSignIn}
                      >
                        {getLocalizedValue(plan.cta, language)}
                      </Button>
                    )}
                  </article>
                ))}
              </div>

              <p className="mx-auto mt-6 max-w-4xl text-center text-sm leading-7 text-muted-foreground">
                {getLocalizedValue(AGENCY_HOME_COPY.pricing.finePrint, language)}
              </p>
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
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
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
                      <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
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
              <h2 className="font-display text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                {getLocalizedValue(AGENCY_HOME_COPY.closingCta.title, language)}
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                {getLocalizedValue(AGENCY_HOME_COPY.closingCta.subtitle, language)}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {session ? (
                  <Button asChild size="lg" className="rounded-full px-8">
                    <Link href="/dashboard">
                      {getLocalizedValue(AGENCY_HOME_COPY.nav.dashboard, language)}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleGoogleSignIn}
                    className="rounded-full px-8"
                  >
                    {getLocalizedValue(AGENCY_HOME_COPY.closingCta.primaryCta, language)}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                )}

                <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                  <a href="#pricing">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.closingCta.secondaryCta,
                      language,
                    )}
                  </a>
                </Button>
              </div>

              <p className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                {getLocalizedValue(AGENCY_HOME_COPY.closingCta.notes, language).map(
                  (note, index, notes) => (
                    <span key={note} className="inline-flex items-center gap-3">
                      <span>{note}</span>
                      {index < notes.length - 1 ? (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-border"
                        />
                      ) : null}
                    </span>
                  ),
                )}
              </p>
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

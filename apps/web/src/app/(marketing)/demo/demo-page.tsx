import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyDashboardClient } from "@/components/property-dashboard/property-dashboard-client";
import { PILOT_BOOKING_URL } from "@/lib/pricing";
import { AgencyHeader } from "../agency-header";
import type { AgencyLandingLanguage } from "../agency-homepage.logic";
import {
  AGENCY_PRODUCTION_BASE_URL,
  getAgencyDemoPath,
} from "../agency-seo.logic";
import {
  ACME_DEMO_BRAND_COLORS,
  getAcmeDemoDashboard,
} from "./acme-demo-data";

const DEMO_COPY = {
  en: {
    metadataTitle: "WebHealth Demo | Acme Bakery Dashboard",
    metadataDescription:
      "Explore the WebHealth demo for SEO optimization: connect Search Console, GA4, crawl checks, and prioritized website improvements in one dashboard.",
    ogDescription:
      "A WebHealth demo for SEO optimization with Search Console, GA4, crawl checks, and prioritized website improvements.",
    ogAlt: "WebHealth SEO optimization demo dashboard",
    skip: "Skip to main content",
    pill: "Demo dashboard",
    title: "Acme Bakery website dashboard",
    lead:
      "See how WebHealth turns Search Console, GA4, crawl checks, and AI-assisted review into prioritized SEO optimization work.",
    pilotCta: "Book pilot check",
    dashboardCta: "Open your dashboard",
    notice:
      "The controls below use the production dashboard surface. Backend actions such as refreshes, assignment, action-state updates, and share-link creation are disabled on this public demo.",
    explore: "Explore filters, charts, evidence, and SEO priorities freely.",
  },
  de: {
    metadataTitle: "WebHealth Demo | Acme Bakery Dashboard",
    metadataDescription:
      "Entdecke die WebHealth Demo zur SEO-Optimierung: Search Console, GA4, Crawl-Checks und priorisierte Website-Maßnahmen in einem Dashboard.",
    ogDescription:
      "Eine WebHealth Demo für SEO-Optimierung mit Search Console, GA4, Crawl-Checks und priorisierten Website-Maßnahmen.",
    ogAlt: "WebHealth Demo-Dashboard zur SEO-Optimierung",
    skip: "Zum Hauptinhalt springen",
    pill: "Demo-Dashboard",
    title: "Acme Bakery Website-Dashboard",
    lead:
      "Sieh, wie WebHealth Search Console, GA4, Crawl-Checks und KI-gestützte Prüfung in priorisierte SEO-Maßnahmen verwandelt.",
    pilotCta: "Pilot-Check buchen",
    dashboardCta: "Eigenes Dashboard öffnen",
    notice:
      "Die Steuerelemente unten nutzen die echte Produktionsoberfläche. Backend-Aktionen wie Refreshes, Zuweisungen, Status-Updates und Share-Links sind in dieser öffentlichen Demo deaktiviert.",
    explore: "Filter, Charts, Evidenz und SEO-Prioritäten frei erkunden.",
  },
} as const;

export function buildDemoMetadata(language: AgencyLandingLanguage): Metadata {
  const copy = DEMO_COPY[language];
  const path = getAgencyDemoPath(language);

  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    alternates: {
      canonical: path,
      languages: {
        de: getAgencyDemoPath("de"),
        en: getAgencyDemoPath("en"),
        "x-default": getAgencyDemoPath("de"),
      },
    },
    openGraph: {
      url: path,
      title: copy.metadataTitle,
      description: copy.ogDescription,
      images: [{ url: "/demo/opengraph-image", width: 1200, height: 630, alt: copy.ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metadataTitle,
      description: copy.ogDescription,
      images: ["/demo/opengraph-image"],
    },
  };
}

export function DemoPageContent({
  language,
}: {
  language: AgencyLandingLanguage;
}) {
  const copy = DEMO_COPY[language];

  return (
    <div className="bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[70] focus-visible:rounded-lg focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:font-medium focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {copy.skip}
      </a>
      <AgencyHeader language={language} languageSwitcherPage="demo" />
      <section className="border-b border-border bg-muted/30 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="size-2 rounded-full bg-primary" />
              {copy.pill}
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              {copy.lead}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <Button asChild size="lg" className="rounded-full px-6">
              <a href={PILOT_BOOKING_URL}>
                {copy.pilotCta}
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-background px-6">
              <Link href="/dashboard">
                {copy.dashboardCta}
                <ExternalLink className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background px-5 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p>{copy.notice}</p>
          </div>
          <p className="font-medium text-foreground">{copy.explore}</p>
        </div>
      </section>

      <main id="main-content" className="mx-auto max-w-7xl px-5 py-8">
        <PropertyDashboardClient
          dashboard={getAcmeDemoDashboard(language)}
          currentUser={{
            id: "demo_user",
            email: "demo@webhealth.dev",
          }}
          brandColors={ACME_DEMO_BRAND_COLORS}
          mode="publicDemo"
          language={language}
        />
      </main>
    </div>
  );
}

export function getDemoMarkdown(language: AgencyLandingLanguage) {
  const path = getAgencyDemoPath(language);

  if (language === "de") {
    return `
# WebHealth Demo

Die öffentliche Demo zeigt ein fiktives Acme-Bakery-Dashboard und macht sichtbar, wie WebHealth Search Console, GA4, Crawl-Checks und KI-gestützte Prüfung in priorisierte SEO-Maßnahmen übersetzt.

Backend-Aktionen wie Refreshes, Zuweisungen, Status-Updates und Share-Links sind in der öffentlichen Demo deaktiviert.

## Öffentliche Links

- [Demo öffnen](${AGENCY_PRODUCTION_BASE_URL}${path})
- [Preise](${AGENCY_PRODUCTION_BASE_URL}/de/pricing)
- [Über WebHealth](${AGENCY_PRODUCTION_BASE_URL}/about)
`;
  }

  return `
# WebHealth demo

The public demo shows a fictional Acme Bakery dashboard that illustrates how WebHealth turns Search Console, GA4, crawl checks, and AI-assisted review into prioritized SEO optimization work.

Backend actions such as refreshes, assignment, action-state updates, and share-link creation are disabled on the public demo.

## Public links

- [Open the demo](${AGENCY_PRODUCTION_BASE_URL}${path})
- [Pricing](${AGENCY_PRODUCTION_BASE_URL}/en/pricing)
- [About WebHealth](${AGENCY_PRODUCTION_BASE_URL}/about)
`;
}

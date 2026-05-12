import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PricingPageContent } from "../../pricing/pricing-page-content";
import type { AgencyLandingLanguage } from "../../agency-homepage.logic";
import {
  buildPricingJsonLd,
  getAgencyPricingPath,
  isAgencyLandingLanguage,
  serializeJsonLd,
} from "../../agency-seo.logic";

type LocalizedPricingPageProps = {
  params: Promise<{ language: string }>;
};

const PRICING_METADATA: Record<
  AgencyLandingLanguage,
  Pick<Metadata, "title" | "description" | "openGraph">
> = {
  de: {
    title: "Preise — WebHealth Founding Agency Pilot",
    description:
      "Founding Agency Pilot: erster Monat kostenlos, danach 149 EUR/Monat. Self-Serve-Pläne bleiben für Einzelprojekte verfügbar.",
    openGraph: {
      title: "Preise — WebHealth Founding Agency Pilot",
      description:
        "Founding Agency Pilot: erster Monat kostenlos, danach 149 EUR/Monat. Self-Serve-Pläne bleiben für Einzelprojekte verfügbar.",
      images: ["/og-image.png"],
    },
  },
  en: {
    title: "Pricing — WebHealth Founding Agency Pilot",
    description:
      "Founding Agency Pilot: first month free, then EUR 149/month. Self-serve plans remain available for individual projects.",
    openGraph: {
      title: "Pricing — WebHealth Founding Agency Pilot",
      description:
        "Founding Agency Pilot: first month free, then EUR 149/month. Self-serve plans remain available for individual projects.",
      images: ["/og-image.png"],
    },
  },
};

export function generateStaticParams() {
  return [{ language: "de" }, { language: "en" }];
}

function resolveLanguage(language: string): AgencyLandingLanguage {
  if (!isAgencyLandingLanguage(language)) notFound();
  return language;
}

export async function generateMetadata({
  params,
}: LocalizedPricingPageProps): Promise<Metadata> {
  const language = resolveLanguage((await params).language);
  const metadata = PRICING_METADATA[language];

  return {
    ...metadata,
    alternates: {
      canonical: getAgencyPricingPath(language),
      languages: {
        de: getAgencyPricingPath("de"),
        en: getAgencyPricingPath("en"),
        "x-default": getAgencyPricingPath("de"),
      },
    },
    openGraph: {
      ...metadata.openGraph,
      url: getAgencyPricingPath(language),
    },
  };
}

export default async function LocalizedPricingPage({
  params,
}: LocalizedPricingPageProps) {
  const language = resolveLanguage((await params).language);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildPricingJsonLd(language)),
        }}
      />
      <PricingPageContent language={language} />
    </>
  );
}

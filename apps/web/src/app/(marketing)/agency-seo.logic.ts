import type { Metadata } from "next";
import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import { AGENCY_FAQ_ITEMS } from "./agency-homepage.content";
import { PUBLIC_PRICING_PLANS } from "@/lib/pricing";

export const AGENCY_PRODUCTION_BASE_URL = "https://webhealth.devbrew.dev";

export type AgencySeoPage = "home" | "topic" | "about";

export const AGENCY_HOME_PATHS: Record<AgencyLandingLanguage, string> = {
  de: "/de",
  en: "/en",
};

export const AGENCY_SEO_TOPIC_SLUGS: Record<AgencyLandingLanguage, string> = {
  de: "seo-reporting-tool-agenturen",
  en: "seo-reporting-software-agencies",
};

export const AGENCY_SEO_TITLES: Record<AgencyLandingLanguage, string> = {
  de: "SEO Reporting Tool für Agenturen | WebHealth Pilot",
  en: "SEO Reporting Software for Agencies | WebHealth Pilot",
};

export function isAgencyLandingLanguage(
  value: string,
): value is AgencyLandingLanguage {
  return value === "de" || value === "en";
}

const AGENCY_SEO_DESCRIPTIONS: Record<AgencyLandingLanguage, string> = {
  de: "WebHealth ist ein founder-led SEO Reporting Tool für Agenturen: GSC, GA4 und Crawl-Signale werden zu Monats-Snapshots und priorisierten Maßnahmen.",
  en: "WebHealth is a founder-led SEO reporting software pilot for agencies: GSC, GA4, and crawl signals become monthly snapshots and prioritized actions.",
};

const AGENCY_TOPIC_TITLES: Record<AgencyLandingLanguage, string> = {
  de: "SEO Reporting Tool für Agenturen — Monats-Snapshots",
  en: "SEO Reporting Software for Agencies — Monthly Snapshots",
};

const AGENCY_TOPIC_DESCRIPTIONS: Record<AgencyLandingLanguage, string> = {
  de: "WebHealth zeigt Agenturen, wie GSC-, GA4- und Crawl-Daten zu Monats-Snapshots, priorisierten SEO-Maßnahmen und Kundenmeeting-Vorbereitung werden.",
  en: "WebHealth shows agencies how GSC, GA4, and crawl data become monthly snapshots, prioritized SEO actions, and client meeting prep.",
};

const AGENCY_ABOUT_TITLES: Record<AgencyLandingLanguage, string> = {
  de: "Über WebHealth — SEO Reporting für Agenturen",
  en: "About WebHealth — SEO Reporting for Agencies",
};

const AGENCY_ABOUT_DESCRIPTIONS: Record<AgencyLandingLanguage, string> = {
  de: "Wer WebHealth baut, wie der Agentur-Pilot funktioniert und warum das Produkt SEO-Reports in überprüfbare Maßnahmen übersetzt.",
  en: "Who builds WebHealth, how the agency pilot works, and why the product turns SEO reporting into reviewable actions.",
};

export function getAgencyHomePath(language: AgencyLandingLanguage) {
  return AGENCY_HOME_PATHS[language];
}

export function getAgencyPricingPath(language: AgencyLandingLanguage) {
  return `${getAgencyHomePath(language)}/pricing`;
}

export function getAgencyDemoPath(language: AgencyLandingLanguage) {
  return `${getAgencyHomePath(language)}/demo`;
}

export function getAgencyAboutPath(language: AgencyLandingLanguage) {
  return `${getAgencyHomePath(language)}/about`;
}

export function getAgencySeoTopicPath(language: AgencyLandingLanguage) {
  return `${getAgencyHomePath(language)}/${AGENCY_SEO_TOPIC_SLUGS[language]}`;
}

export function getAgencyRootRedirectPath(acceptLanguage: string | null) {
  return getAgencyHomePath(resolvePreferredAgencyLanguage(acceptLanguage));
}

export function resolvePreferredAgencyLanguage(
  acceptLanguage: string | null,
): AgencyLandingLanguage {
  if (!acceptLanguage) return "de";

  const preferences = acceptLanguage
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(";");
      const q = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;

      return {
        language: rawTag.toLowerCase().split("-")[0],
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((part) => part.quality > 0);

  const englishQuality = Math.max(
    0,
    ...preferences
      .filter((part) => part.language === "en")
      .map((part) => part.quality),
  );
  const germanQuality = Math.max(
    0,
    ...preferences
      .filter((part) => part.language === "de")
      .map((part) => part.quality),
  );

  if (englishQuality === 0) return "de";
  if (germanQuality === 0) return "en";
  if (englishQuality > germanQuality) return "en";

  return "de";
}

export function getAgencyLanguageAlternates(page: AgencySeoPage) {
  const de =
    page === "home"
      ? getAgencyHomePath("de")
      : page === "about"
        ? getAgencyAboutPath("de")
        : getAgencySeoTopicPath("de");
  const en =
    page === "home"
      ? getAgencyHomePath("en")
      : page === "about"
        ? getAgencyAboutPath("en")
        : getAgencySeoTopicPath("en");

  return {
    de,
    en,
    "x-default": de,
  };
}

export function buildAgencyHomeMetadata(language: AgencyLandingLanguage): Metadata {
  const path = getAgencyHomePath(language);

  return {
    title: AGENCY_SEO_TITLES[language],
    description: AGENCY_SEO_DESCRIPTIONS[language],
    alternates: {
      canonical: path,
      languages: getAgencyLanguageAlternates("home"),
    },
    openGraph: {
      url: path,
      title: AGENCY_SEO_TITLES[language],
      description: AGENCY_SEO_DESCRIPTIONS[language],
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: AGENCY_SEO_TITLES[language],
      description: AGENCY_SEO_DESCRIPTIONS[language],
      images: ["/og-image.png"],
    },
  };
}

export function buildAgencySeoTopicMetadata(
  language: AgencyLandingLanguage,
): Metadata {
  const path = getAgencySeoTopicPath(language);

  return {
    title: AGENCY_TOPIC_TITLES[language],
    description: AGENCY_TOPIC_DESCRIPTIONS[language],
    alternates: {
      canonical: path,
      languages: getAgencyLanguageAlternates("topic"),
    },
    openGraph: {
      url: path,
      title: AGENCY_TOPIC_TITLES[language],
      description: AGENCY_TOPIC_DESCRIPTIONS[language],
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: AGENCY_TOPIC_TITLES[language],
      description: AGENCY_TOPIC_DESCRIPTIONS[language],
      images: ["/og-image.png"],
    },
  };
}

export function buildAgencyAboutMetadata(language: AgencyLandingLanguage): Metadata {
  const path = getAgencyAboutPath(language);

  return {
    title: AGENCY_ABOUT_TITLES[language],
    description: AGENCY_ABOUT_DESCRIPTIONS[language],
    alternates: {
      canonical: path,
      languages: getAgencyLanguageAlternates("about"),
    },
    openGraph: {
      url: path,
      title: AGENCY_ABOUT_TITLES[language],
      description: AGENCY_ABOUT_DESCRIPTIONS[language],
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: AGENCY_ABOUT_TITLES[language],
      description: AGENCY_ABOUT_DESCRIPTIONS[language],
      images: ["/og-image.png"],
    },
  };
}

export function buildAgencyJsonLd(
  language: AgencyLandingLanguage,
  page: AgencySeoPage,
) {
  const pagePath = page === "home" ? getAgencyHomePath(language) : getAgencySeoTopicPath(language);
  const url = `${AGENCY_PRODUCTION_BASE_URL}${pagePath}`;
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Organization",
      "@id": `${AGENCY_PRODUCTION_BASE_URL}/#organization`,
      name: "DevBrew",
      url: AGENCY_PRODUCTION_BASE_URL,
      brand: {
        "@type": "Brand",
        name: "WebHealth",
      },
    },
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name:
        language === "de"
          ? "Founder-led SEO Reporting Pilot für Agenturen"
          : "Founder-led SEO Reporting Pilot for Agencies",
      serviceType:
        language === "de"
          ? "SEO Reporting Tool für Agenturen"
          : "SEO reporting software for agencies",
      provider: {
        "@id": `${AGENCY_PRODUCTION_BASE_URL}/#organization`,
      },
      areaServed: language === "de" ? ["DE", "AT", "CH"] : "Europe",
      url,
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${AGENCY_PRODUCTION_BASE_URL}/#software`,
      name: "WebHealth",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "149",
        priceCurrency: "EUR",
        availability: "https://schema.org/LimitedAvailability",
      },
      url,
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: AGENCY_FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question[language],
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer[language],
        },
      })),
    },
  ];

  if (page === "topic") {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: language === "de" ? "Startseite" : "Homepage",
          item: `${AGENCY_PRODUCTION_BASE_URL}${getAgencyHomePath(language)}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: AGENCY_TOPIC_TITLES[language],
          item: url,
        },
      ],
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

function parseEuroPrice(price: string) {
  const digits = price.replace(/[^\d]/g, "");
  return digits.length > 0 ? digits : "0";
}

export function buildPricingJsonLd(language: AgencyLandingLanguage = "en") {
  const offers = PUBLIC_PRICING_PLANS.map((plan) => ({
    "@type": "Offer",
    name: plan.name[language],
    description: plan.description[language],
    price: parseEuroPrice(plan.price[language]),
    priceCurrency: "EUR",
    url: `${AGENCY_PRODUCTION_BASE_URL}${getAgencyPricingPath(language)}`,
    availability: "https://schema.org/InStock",
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${AGENCY_PRODUCTION_BASE_URL}/#software`,
        name: "WebHealth",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: "0",
          highPrice: "149",
          offerCount: String(offers.length),
          offers,
        },
      },
    ],
  };
}

export function buildMarketingSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${AGENCY_PRODUCTION_BASE_URL}/#organization`,
        name: "DevBrew",
        url: AGENCY_PRODUCTION_BASE_URL,
        email: "kontakt@devbrew.dev",
        brand: {
          "@type": "Brand",
          name: "WebHealth",
          url: AGENCY_PRODUCTION_BASE_URL,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${AGENCY_PRODUCTION_BASE_URL}/#website`,
        name: "WebHealth",
        url: AGENCY_PRODUCTION_BASE_URL,
        publisher: {
          "@id": `${AGENCY_PRODUCTION_BASE_URL}/#organization`,
        },
        inLanguage: ["de", "en"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${AGENCY_PRODUCTION_BASE_URL}/#software`,
        name: "WebHealth",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "SEO and analytics monitoring for agencies using Search Console, GA4, and crawl signals.",
        offers: {
          "@type": "Offer",
          price: "149",
          priceCurrency: "EUR",
          availability: "https://schema.org/LimitedAvailability",
          url: `${AGENCY_PRODUCTION_BASE_URL}/pricing`,
        },
      },
    ],
  };
}

export function serializeJsonLd(jsonLd: unknown) {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

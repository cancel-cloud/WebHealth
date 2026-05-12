import type { Metadata } from "next";
import {
  buildPricingJsonLd,
  getAgencyPricingPath,
  serializeJsonLd,
} from "../agency-seo.logic";
import { PricingPageContent } from "./pricing-page-content";

export const metadata: Metadata = {
  title: "Preise — WebHealth Founding Agency Pilot",
  description:
    "Founding Agency Pilot: erster Monat kostenlos, danach 149 EUR/Monat. Self-Serve-Pläne bleiben für Einzelprojekte verfügbar.",
  alternates: {
    canonical: getAgencyPricingPath("de"),
    languages: {
      de: getAgencyPricingPath("de"),
      en: getAgencyPricingPath("en"),
      "x-default": getAgencyPricingPath("de"),
    },
  },
  openGraph: {
    url: "/pricing",
    title: "Preise — WebHealth Founding Agency Pilot",
    description:
      "Founding Agency Pilot: erster Monat kostenlos, danach 149 EUR/Monat. Self-Serve-Pläne bleiben für Einzelprojekte verfügbar.",
    images: ["/og-image.png"],
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildPricingJsonLd("de")) }}
      />
      <PricingPageContent language="de" />
    </>
  );
}

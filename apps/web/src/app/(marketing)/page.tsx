import type { Metadata } from "next";
import { AgencyHomepageClient } from "./agency-homepage-client";

export const metadata: Metadata = {
  title: "WebHealth Agentur-Pilot — SEO-Reports in Maßnahmen verwandeln",
  description:
    "Founding Agency Pilot: GSC, GA4 und Crawl-Signale in gebrandete Monats-Snapshots und priorisierte Kunden-Maßnahmen verwandeln.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "WebHealth Agentur-Pilot — SEO-Reports in Maßnahmen verwandeln",
    description:
      "Founding Agency Pilot: GSC, GA4 und Crawl-Signale in gebrandete Monats-Snapshots und priorisierte Kunden-Maßnahmen verwandeln.",
    images: ["/og-image.png"],
  },
};

export default function HomePage() {
  return <AgencyHomepageClient />;
}

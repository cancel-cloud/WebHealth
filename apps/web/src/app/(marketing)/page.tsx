import type { Metadata } from "next";
import { AgencyHomepageClient } from "./agency-homepage-client";

export const metadata: Metadata = {
  title: "Webhealth for Agencies — Live SEO & Analytics Snapshots",
  description:
    "Agency-first SEO and GA4 monitoring with white-label client workspaces, transparent pricing, and ranked fix lists in three minutes.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Webhealth for Agencies — Live SEO & Analytics Snapshots",
    description:
      "Agency-first SEO and GA4 monitoring with white-label client workspaces, transparent pricing, and ranked fix lists in three minutes.",
    images: ["/og-image.png"],
  },
};

export default function HomePage() {
  return <AgencyHomepageClient />;
}

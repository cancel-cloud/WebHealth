import type { Metadata } from "next";
import { AgencyHomepageClient } from "./agency-homepage-client";

export const metadata: Metadata = {
  title: "Webhealth for Agencies",
  description:
    "Agency-first Webhealth homepage with bilingual messaging, multi-client workspace preview, reference pricing, and roadmap-safe agency positioning.",
};

export default function HomePage() {
  return <AgencyHomepageClient />;
}

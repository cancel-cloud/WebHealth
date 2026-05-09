import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyDashboardClient } from "@/components/property-dashboard/property-dashboard-client";
import { PILOT_BOOKING_URL } from "@/lib/pricing";
import { ACME_DEMO_BRAND_COLORS, ACME_DEMO_DASHBOARD } from "./acme-demo-data";

export const metadata: Metadata = {
  title: "WebHealth Demo | Acme Bakery Dashboard",
  description:
    "Explore a fictional Acme Bakery dashboard with WebHealth's ranked SEO actions, GSC, GA4, crawl signals, and client-ready workflow.",
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: "WebHealth Demo | Acme Bakery Dashboard",
    description:
      "A fictional demo dashboard showing ranked SEO actions from GSC, GA4, and crawl signals.",
    images: [{ url: "/demo/opengraph-image", width: 1200, height: 630, alt: "WebHealth fictional Acme Bakery demo dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WebHealth Demo | Acme Bakery Dashboard",
    description:
      "A fictional demo dashboard showing ranked SEO actions from GSC, GA4, and crawl signals.",
    images: ["/demo/opengraph-image"],
  },
};

export default function DemoPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-border bg-muted/30 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <span className="size-2 rounded-full bg-primary" />
              Fictional sample data, not customer results
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Acme Bakery website dashboard
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              See how WebHealth turns Search Console, GA4, crawl checks, and AI-assisted review into a ranked agency action backlog for the next client update.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
            <Button asChild size="lg" className="rounded-full px-6">
              <a href={PILOT_BOOKING_URL}>
                Book pilot check
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-background px-6">
              <Link href="/dashboard">
                Open your dashboard
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
            <p>
              The controls below use the production dashboard surface. Backend actions such as refreshes, assignment, action-state updates, and share-link creation are disabled on this public demo.
            </p>
          </div>
          <p className="font-medium text-foreground">Explore filters, charts, evidence, and ranked actions freely.</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <PropertyDashboardClient
          dashboard={ACME_DEMO_DASHBOARD}
          currentUser={{
            id: "demo_user",
            email: "demo@webhealth.dev",
          }}
          brandColors={ACME_DEMO_BRAND_COLORS}
          mode="publicDemo"
        />
      </main>
    </div>
  );
}

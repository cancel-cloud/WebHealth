import type { Metadata } from "next";
import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "Pricing — Webhealth Plans for Solo, Pro, and Agency Teams",
  description:
    "Simple, transparent Webhealth pricing — free Solo plan, Pro for growing teams, and Agency for white-label client workspaces. No credit card.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    url: "/pricing",
    title: "Pricing — Webhealth Plans for Solo, Pro, and Agency Teams",
    description:
      "Simple, transparent Webhealth pricing — free Solo plan, Pro for growing teams, and Agency for white-label client workspaces. No credit card.",
    images: ["/og-image.png"],
  },
};

export default function PricingPage() {
  return (
    <div className="py-20">
      <PricingSection />
      <section className="mx-auto mt-20 max-w-3xl px-6 text-base leading-relaxed">
        <h2 className="font-display text-2xl font-semibold">
          What is included on every plan
        </h2>
        <p className="mt-4 text-muted-foreground">
          Every Webhealth plan includes Google Search Console and Google
          Analytics 4 connectors, automatic property sync after sign-in, live
          crawl and deterministic ranked fix lists, encrypted token storage,
          and access to the dashboard from any device. We do not charge extra
          for additional users on a single workspace, exporting snapshots, or
          revisiting historical reports — the price you see at sign-up is the
          full price.
        </p>

        <h2 className="mt-12 font-display text-2xl font-semibold">
          Choosing between Solo, Pro, and Agency
        </h2>
        <p className="mt-4 text-muted-foreground">
          Solo is designed for a single site owner running one or two
          properties; it is free and stays free. Pro suits freelancers and
          small studios who need additional snapshot history, scheduled
          refreshes, and white-label-ready exports. Agency is for teams who
          serve multiple clients from one Webhealth workspace, with branded
          client-facing dashboards, shareable links, and priority support
          when an audit needs to ship the same day.
        </p>

        <h2 className="mt-12 font-display text-2xl font-semibold">
          Billing, cancellation, and upgrades
        </h2>
        <p className="mt-4 text-muted-foreground">
          Paid plans are billed monthly through Stripe and can be cancelled at
          any time inside the billing portal. Upgrades take effect immediately
          and are pro-rated so you only pay for the time you actually use the
          higher plan. Downgrades or cancellations remain in effect until the
          end of the current billing period; your dashboards stay accessible
          throughout. Refund handling follows the checkout terms and the
          consumer-rights protections summarised in our{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>
          .
        </p>

        <h2 className="mt-12 font-display text-2xl font-semibold">
          Questions before you sign up?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Read more about the team and how we operate Webhealth on the{" "}
          <Link href="/about" className="underline">
            About page
          </Link>
          , or email{" "}
          <a href="mailto:kontakt@devbrew.dev" className="underline">
            kontakt@devbrew.dev
          </a>{" "}
          and we will reply within one business day.
        </p>
      </section>
    </div>
  );
}

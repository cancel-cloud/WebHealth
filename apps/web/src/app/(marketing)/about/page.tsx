import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Webhealth — SEO and Analytics Built for Agencies",
  description:
    "Webhealth is built by DevBrew so agencies can monitor SEO, Search Console, and GA4 performance for client websites with deterministic ranked fix lists.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    url: "/about",
    title: "About Webhealth — SEO and Analytics Built for Agencies",
    description:
      "Webhealth is built by DevBrew so agencies can monitor SEO, Search Console, and GA4 performance for client websites with deterministic ranked fix lists.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Webhealth — SEO and Analytics Built for Agencies",
    description:
      "Webhealth is built by DevBrew so agencies can monitor SEO, Search Console, and GA4 performance for client websites with deterministic ranked fix lists.",
    images: ["/og-image.png"],
  },
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <header className="mb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          About
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Built so agencies can ship SEO fixes, not chase data.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Webhealth connects Google Search Console and Google Analytics 4 to
          your client workspaces, runs a live crawl, and turns the result into
          a ranked, deterministic fix list — so the first hour of every audit
          stops being spent on data plumbing.
        </p>
      </header>

      <section className="space-y-6 text-base leading-relaxed">
        <h2 className="font-display text-2xl font-semibold">Who builds Webhealth</h2>
        <p>
          Webhealth is operated by{" "}
          <span className="font-semibold">DevBrew</span>, a small Frankfurt-based
          studio focused on tooling for agencies and freelance web teams.
          Provider details, contact information, and our register entry are
          published in the{" "}
          <Link href="/impressum" className="underline">
            Impressum
          </Link>
          . We are based in Germany, our infrastructure runs inside the EU on
          Hetzner and Vercel, and we operate the product as the data
          controller for every connected workspace.
        </p>
        <p>
          We work with a small group of agencies and freelancers in production
          today, and we use Webhealth on our own client engagements before
          shipping new logic to anyone else. Every ranked fix you see in a
          report has been pressure-tested against real Search Console and
          Analytics data first.
        </p>

        <h2 className="font-display text-2xl font-semibold">What we believe</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            Recommendations should be deterministic and reviewable. Every fix
            in a Webhealth report links back to the underlying GSC, GA4, or
            crawl signal that produced it. There is no opaque scoring layer:
            you can audit how a recommendation was ranked and why it was
            surfaced.
          </li>
          <li>
            White-label is a first-class feature. Agencies can brand workspaces
            and share dashboards directly with clients without exposing the
            Webhealth UI, and the same insights show up under your domain and
            your colour palette.
          </li>
          <li>
            Privacy is a feature too. Google OAuth tokens are encrypted at rest
            with AES-256-GCM, we never sell connected user data, and analytics
            cookies stay disabled until the visitor opts in. The full notice
            lives in the{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </li>
          <li>
            Speed matters. A Webhealth snapshot takes minutes, not days, and
            the dashboards refresh on demand so a Friday afternoon client call
            does not need a week of preparation work.
          </li>
        </ul>

        <h2 className="font-display text-2xl font-semibold">How we work with agencies</h2>
        <p>
          Most teams onboard a single workspace, connect one Google account
          covering several Search Console and Analytics 4 properties, and let
          Webhealth sync the available properties automatically. From there
          the same workspace handles client reviews, retainer reporting, and
          ad-hoc audits. If you outgrow the Solo or Pro plan we move you to
          Agency without a migration step — the dashboards, history, and
          shareable links carry over unchanged.
        </p>

        <h2 className="font-display text-2xl font-semibold">Where to go next</h2>
        <p>
          See live{" "}
          <Link href="/pricing" className="underline">
            pricing for Solo, Pro, and Agency plans
          </Link>
          , review the{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>
          , or email us at{" "}
          <a href="mailto:kontakt@devbrew.dev" className="underline">
            kontakt@devbrew.dev
          </a>{" "}
          for partnership and custom-deployment questions. We typically reply
          inside one business day.
        </p>
      </section>
    </article>
  );
}

import type { Metadata } from "next";
import { PRICING_PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Terms of Service — Webhealth",
  description: "Terms and conditions for using Webhealth.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Last updated: March 2026
      </p>

      <div className="prose prose-sm max-w-none space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-bold font-display mb-3">1. Acceptance</h2>
          <p className="text-muted-foreground leading-relaxed">
            By creating an account or using Webhealth (&ldquo;the
            Service&rdquo;), you agree to these Terms of Service. If you do not
            agree, do not use the Service. These Terms are between you and
            DevBrew (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            2. Description of Service
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Webhealth is an automated SEO and analytics reporting tool that
            connects to Google Search Console and Google Analytics 4 via OAuth,
            crawls your websites, and generates AI-assisted reports with
            actionable recommendations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            3. Account registration
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            You must sign in with a valid Google account. You are responsible
            for maintaining the security of your account and for all activity
            that occurs under it. You must be at least 16 years old to use the
            Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            4. Acceptable use
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-2">
            You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
            <li>
              Use the Service to crawl websites you do not own or have explicit
              permission to crawl.
            </li>
            <li>
              Attempt to reverse-engineer, decompile, or extract source code
              from the Service.
            </li>
            <li>
              Use the Service in a way that violates any applicable law or
              regulation.
            </li>
            <li>
              Resell or sublicense access to the Service without written
              permission.
            </li>
            <li>
              Abuse the report-generation pipeline (e.g., automated mass report
              creation).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            5. Plans and billing
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is offered on a Solo plan (5 reports per month) and paid
            plans (Pro at {PRICING_PLANS.pro.priceLabel}/mo, Agency at{" "}
            {PRICING_PLANS.agency.priceLabel}/mo). Paid plans are billed monthly
            via Stripe. You may cancel at any time; cancellation takes effect at
            the end of the current billing period. No refunds are issued for
            partial months.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            6. AI-generated content
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Reports contain AI-generated analysis and recommendations. This
            content is provided for informational purposes only and does not
            constitute professional SEO, legal, or financial advice. We make no
            guarantees about the accuracy, completeness, or fitness for any
            particular purpose of AI-generated content. You are solely
            responsible for decisions made based on report output.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            7. Intellectual property
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service, including all software, design, and content created by
            us, is our intellectual property. Reports generated from your data
            belong to you. We grant you a non-exclusive, non-transferable
            licence to access and use the Service in accordance with these
            Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            8. Disclaimer of warranties
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; without warranties of any kind, express or implied.
            We do not warrant that the Service will be error-free,
            uninterrupted, or that reports will be accurate. Use is at your own
            risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            9. Limitation of liability
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, DevBrew shall not be liable
            for any indirect, incidental, special, consequential, or punitive
            damages arising from your use of the Service. Our total liability to
            you shall not exceed the amount you paid us in the 12 months
            preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            10. Termination
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            You may delete your account at any time. We reserve the right to
            suspend or terminate accounts that violate these Terms, with or
            without notice. Upon termination, your data will be deleted in
            accordance with our Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            11. Governing law
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            These Terms are governed by the laws of Germany. Any disputes shall
            be subject to the exclusive jurisdiction of the courts of Germany.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">12. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about these Terms? Email us at{" "}
            <a
              href="mailto:contact@devbrew.dev"
              className="text-primary underline"
            >
              contact@devbrew.dev
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

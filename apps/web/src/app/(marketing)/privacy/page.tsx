import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Webhealth",
  description: "How Webhealth collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Last updated: March 2026
      </p>

      <div className="prose prose-sm max-w-none space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-bold font-display mb-3">1. Who we are</h2>
          <p className="text-muted-foreground leading-relaxed">
            Webhealth (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
            a SaaS product by DevBrew. We provide automated SEO and analytics
            reporting by connecting to Google Search Console and Google
            Analytics 4. Contact:{" "}
            <a
              href="mailto:contact@devbrew.dev"
              className="text-primary underline"
            >
              contact@devbrew.dev
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            2. Data we collect
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Account data:</strong> Your
              name, email address, and profile picture obtained via Google OAuth
              when you sign in.
            </li>
            <li>
              <strong className="text-foreground">
                Google Search Console data:
              </strong>{" "}
              Click, impression, CTR, and position metrics for properties you
              have authorised. Data is fetched on-demand when you generate a
              report.
            </li>
            <li>
              <strong className="text-foreground">
                Google Analytics 4 data:
              </strong>{" "}
              Session and user counts for linked GA4 properties. Fetched under
              the same OAuth grant, on-demand.
            </li>
            <li>
              <strong className="text-foreground">Crawl data:</strong> When you
              generate a report, we crawl your site to detect SEO issues
              (missing titles, broken links, etc.). Only publicly accessible
              pages are crawled.
            </li>
            <li>
              <strong className="text-foreground">Usage data:</strong> Report
              generation history, settings preferences, and feature-flag state
              stored in our database.
            </li>
            <li>
              <strong className="text-foreground">Payment data:</strong> If you
              subscribe to a paid plan, billing is handled by Stripe. We store
              only your Stripe customer ID — we never see or store your card
              details.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            3. Google OAuth scopes
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-2">
            We request the following Google OAuth scopes. We access only what is
            necessary to generate your report:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
            <li>
              <code className="bg-muted px-1 rounded text-xs">
                https://www.googleapis.com/auth/webmasters.readonly
              </code>{" "}
              — Read-only access to Search Console data.
            </li>
            <li>
              <code className="bg-muted px-1 rounded text-xs">
                https://www.googleapis.com/auth/analytics.readonly
              </code>{" "}
              — Read-only access to Google Analytics data.
            </li>
            <li>
              <code className="bg-muted px-1 rounded text-xs">
                openid profile email
              </code>{" "}
              — Basic identity for account creation.
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-2">
            We do not request write access to your Google accounts. You can
            revoke access at any time via your Google Account security settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            4. How we use your data
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
            <li>To generate SEO and analytics reports on your request.</li>
            <li>To store report history so you can review past audits.</li>
            <li>
              To send transactional notifications (report complete, sync
              failure) if you opt in.
            </li>
            <li>To enforce plan limits and process billing via Stripe.</li>
            <li>
              To improve the product by analysing aggregated, anonymised usage
              patterns.
            </li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-2">
            We do not sell your data to third parties. We do not use your GSC or
            GA4 data for any purpose other than generating your reports.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            5. Data retention
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Report data and raw metrics are retained for as long as your account
            is active. If you delete your account, all associated data is
            permanently deleted within 30 days. You can request earlier deletion
            by contacting us at{" "}
            <a
              href="mailto:contact@devbrew.dev"
              className="text-primary underline"
            >
              contact@devbrew.dev
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            6. Third-party processors
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Google</strong> — OAuth and
              data source.
            </li>
            <li>
              <strong className="text-foreground">OpenAI</strong> — AI analysis
              of your report data. Data is sent as anonymised snapshots; we do
              not send identifying personal information.
            </li>
            <li>
              <strong className="text-foreground">Stripe</strong> — Payment
              processing.
            </li>
            <li>
              <strong className="text-foreground">Vercel</strong> — Application
              hosting.
            </li>
            <li>
              <strong className="text-foreground">Neon / PostgreSQL</strong> —
              Database hosting in the EU.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">7. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use a single session cookie to keep you signed in. No advertising
            or tracking cookies are used.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            8. Your rights
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data.
            To exercise any of these rights, email{" "}
            <a
              href="mailto:contact@devbrew.dev"
              className="text-primary underline"
            >
              contact@devbrew.dev
            </a>
            . If you are in the EEA or UK, you also have rights under GDPR / UK
            GDPR, including the right to lodge a complaint with your local
            supervisory authority.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold font-display mb-3">
            9. Changes to this policy
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update this policy from time to time. Material changes will
            be communicated via email or an in-app notice. Continued use of
            Webhealth after changes constitutes acceptance.
          </p>
        </section>
      </div>
    </div>
  );
}

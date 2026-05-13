import Link from "next/link";
import { AgencyHeader } from "../agency-header";
import type { AgencyLandingLanguage } from "../agency-homepage.logic";
import {
  getAgencyPricingPath,
  getAgencySeoTopicPath,
} from "../agency-seo.logic";
import {
  buildLegalHref,
  type LegalLocale,
} from "../legal/legal-routes";

const ABOUT_COPY = {
  de: {
    eyebrow: "Über WebHealth",
    title: "Gebaut, damit Agenturen SEO-Maßnahmen ausliefern statt Daten zu jagen.",
    lead:
      "WebHealth verbindet Google Search Console und Google Analytics 4 mit Crawl-Checks und übersetzt die Signale in priorisierte, überprüfbare Fix-Listen für Kunden-Websites.",
    sections: [
      {
        title: "Wer WebHealth baut",
        body: (
          <>
            WebHealth wird von <span className="font-semibold">DevBrew</span> betrieben, einem kleinen Studio aus Frankfurt mit Fokus auf Tools für Agenturen und freie Webteams. Anbieterangaben, Kontaktinformationen und Pflichtangaben stehen im{" "}
            <Link href={buildLegalHref("impressum", "de")} className="underline">
              Impressum
            </Link>
            . Wir sitzen in Deutschland und betreiben die Produktinfrastruktur innerhalb der EU.
          </>
        ),
      },
      {
        title: "Warum es WebHealth gibt",
        body: "Viele SEO-Reports erklären, was passiert ist. WebHealth soll zeigen, welche Maßnahme als Nächstes sinnvoll ist, welche Daten dahinterliegen und wie dringend der Fix ist. Jede Empfehlung bleibt nachvollziehbar und auf GSC-, GA4- oder Crawl-Signale zurückführbar.",
      },
      {
        title: "Wie wir mit Agenturen arbeiten",
        body: "Der aktuelle Agentur-Pilot ist founder-led: Wir richten gemeinsam echte Kunden-Websites ein, prüfen den Monats-Snapshot im Agenturkontext und verbessern den Workflow anhand realer Retainer-, Audit- und Kundenmeeting-Prozesse.",
      },
      {
        title: "Datenschutz und Betrieb",
        body: (
          <>
            Google OAuth Tokens werden verschlüsselt gespeichert, Browser-Analytics bleiben bis zur Einwilligung deaktiviert, und Kunden- sowie Dashboard-Daten sind keine öffentlichen Discovery-Flächen. Die Details stehen in den{" "}
            <Link href={buildLegalHref("privacy", "de")} className="underline">
              Datenschutzhinweisen
            </Link>
            .
          </>
        ),
      },
    ],
    nextTitle: "Weiterlesen",
    nextLinks: [
      {
        href: getAgencySeoTopicPath("de"),
        label: "SEO Reporting Tool für Agenturen",
      },
      {
        href: getAgencyPricingPath("de"),
        label: "Preise und Agentur-Pilot",
      },
      {
        href: buildLegalHref("terms", "de"),
        label: "Nutzungsbedingungen",
      },
    ],
    contactPrefix: "Fragen zu Partnerschaften oder Setups:",
  },
  en: {
    eyebrow: "About WebHealth",
    title: "Built so agencies can ship SEO fixes, not chase data.",
    lead:
      "WebHealth connects Google Search Console and Google Analytics 4 with crawl checks and turns those signals into prioritized, reviewable fix lists for client websites.",
    sections: [
      {
        title: "Who builds WebHealth",
        body: (
          <>
            WebHealth is operated by <span className="font-semibold">DevBrew</span>, a small Frankfurt-based studio focused on tooling for agencies and freelance web teams. Provider details, contact information, and mandatory legal information are published in the{" "}
            <Link href={buildLegalHref("impressum", "en")} className="underline">
              Impressum
            </Link>
            . We are based in Germany and run the product infrastructure inside the EU.
          </>
        ),
      },
      {
        title: "Why WebHealth exists",
        body: "Many SEO reports explain what happened. WebHealth is meant to show which action should happen next, which data supports it, and how urgent the fix is. Every recommendation stays traceable to GSC, GA4, or crawl evidence.",
      },
      {
        title: "How we work with agencies",
        body: "The current agency pilot is founder-led: we set up real client websites together, review the monthly snapshot in the agency context, and improve the workflow around real retainer, audit, and client-meeting processes.",
      },
      {
        title: "Privacy and operations",
        body: (
          <>
            Google OAuth tokens are encrypted at rest, browser analytics stay disabled until consent, and customer/dashboard data is not a public discovery surface. The details are covered in the{" "}
            <Link href={buildLegalHref("privacy", "en")} className="underline">
              Privacy Policy
            </Link>
            .
          </>
        ),
      },
    ],
    nextTitle: "Read next",
    nextLinks: [
      {
        href: getAgencySeoTopicPath("en"),
        label: "SEO reporting software for agencies",
      },
      {
        href: getAgencyPricingPath("en"),
        label: "Pricing and agency pilot",
      },
      {
        href: buildLegalHref("terms", "en"),
        label: "Terms of Service",
      },
    ],
    contactPrefix: "Questions about partnerships or setups:",
  },
} as const;

export function AboutPageContent({
  language,
}: {
  language: AgencyLandingLanguage;
}) {
  const copy = ABOUT_COPY[language];
  const legalLocale: LegalLocale = language;

  return (
    <>
      <AgencyHeader language={language} languageSwitcherPage="about" />
      <main className="mx-auto w-full max-w-4xl px-6 py-20">
        <article>
          <header className="mb-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {copy.eyebrow}
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {copy.lead}
            </p>
          </header>

          <section className="space-y-10 text-base leading-relaxed">
            {copy.sections.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-2xl font-semibold">{section.title}</h2>
                <p className="mt-4 text-muted-foreground">{section.body}</p>
              </div>
            ))}
          </section>

          <section className="mt-14 border-t border-border pt-8">
            <h2 className="font-display text-2xl font-semibold">{copy.nextTitle}</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {copy.nextLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              {copy.contactPrefix}{" "}
              <a href="mailto:kontakt@devbrew.dev" className="underline">
                kontakt@devbrew.dev
              </a>
              {" · "}
              <Link href={buildLegalHref("impressum", legalLocale)} className="underline">
                Impressum
              </Link>
            </p>
          </section>
        </article>
      </main>
    </>
  );
}

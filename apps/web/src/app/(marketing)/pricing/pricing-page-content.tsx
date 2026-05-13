import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";
import type { PublicPricingLanguage } from "@/lib/pricing";
import { AgencyHeader } from "../agency-header";
import { getAgencyAboutPath } from "../agency-seo.logic";

const PRICING_PAGE_COPY = {
  de: {
    sections: [
      {
        title: "Was im Pilot konkret passiert",
        body: (
          <>
            Im ersten Monat richten wir gemeinsam 3-10 Kunden-Websites ein und
            erstellen einen gebrandeten SEO-Monats-Snapshot: KPI-Veränderungen,
            Traffic-Drops, auffällige Seiten, Query-Chancen, Crawl-Hinweise und
            die wichtigsten nächsten Maßnahmen für dein Kundenmeeting.
          </>
        ),
      },
      {
        title: "Warum die Agentur zuerst über den Pilot geht",
        body: (
          <>
            Der Pilot ist nicht einfach ein Checkout in ein weiteres Dashboard.
            Er testet mit passenden Agenturen den Schritt nach Ahrefs, Semrush,
            Screaming Frog oder Looker Studio: aus GSC-, GA4- und Crawl-Signalen
            entsteht ein priorisierter Maßnahmenplan, den du intern abarbeiten
            oder mit Kunden besprechen kannst.
          </>
        ),
      },
      {
        title: "Zahlung nach dem kostenlosen ersten Monat",
        body: (
          <>
            Für den kostenlosen Pilot-Monat ist kein Stripe-Eintrag nötig. Wenn
            der Workflow nach dem ersten Monats-Snapshot passt, schicken wir den
            Zahlungslink für den Founder-Preis von 149 EUR/Monat. Normale
            Self-Serve-Pläne laufen weiterhin über Stripe und folgen den
            Bedingungen in unseren{" "}
            <Link href="/de/terms" className="underline">
              Nutzungsbedingungen
            </Link>
            .
          </>
        ),
      },
      {
        title: "Fragen vor dem Pilot-Check?",
        body: (
          <>
            Lies mehr über das Team und den Betrieb von WebHealth auf der{" "}
            <Link href={getAgencyAboutPath("de")} className="underline">
              About-Seite
            </Link>
            , oder schreib an{" "}
            <a href="mailto:kontakt@devbrew.dev" className="underline">
              kontakt@devbrew.dev
            </a>
            .
          </>
        ),
      },
    ],
  },
  en: {
    sections: [
      {
        title: "What happens in the pilot",
        body: (
          <>
            In the first month we set up 3-10 client websites together and
            create a branded monthly SEO snapshot: KPI changes, traffic drops,
            notable pages, query opportunities, crawl signals, and the most
            important next actions for your client meeting.
          </>
        ),
      },
      {
        title: "Why agencies start with the pilot",
        body: (
          <>
            The pilot is not just a checkout into another dashboard. It tests the
            step after Ahrefs, Semrush, Screaming Frog, or Looker Studio with the
            right agencies: GSC, GA4, and crawl signals become a prioritized
            action plan you can work through internally or discuss with clients.
          </>
        ),
      },
      {
        title: "Payment after the free first month",
        body: (
          <>
            No Stripe entry is required for the free pilot month. If the workflow
            fits after the first monthly snapshot, we send the payment link for
            the founder rate of EUR 149/month. Normal self-serve plans continue
            to run through Stripe and follow our{" "}
            <Link href="/en/terms" className="underline">
              Terms of Service
            </Link>
            .
          </>
        ),
      },
      {
        title: "Questions before the pilot check?",
        body: (
          <>
            Read more about the team and how WebHealth operates on the{" "}
            <Link href={getAgencyAboutPath("en")} className="underline">
              About page
            </Link>
            , or email{" "}
            <a href="mailto:kontakt@devbrew.dev" className="underline">
              kontakt@devbrew.dev
            </a>
            .
          </>
        ),
      },
    ],
  },
} satisfies Record<
  PublicPricingLanguage,
  {
    sections: Array<{
      title: string;
      body: React.ReactNode;
    }>;
  }
>;

export function PricingPageContent({
  language,
}: {
  language: PublicPricingLanguage;
}) {
  const copy = PRICING_PAGE_COPY[language];

  return (
    <>
      <AgencyHeader language={language} languageSwitcherPage="pricing" />
      <div className="py-20">
        <PricingSection language={language} />
        <section className="mx-auto mt-20 max-w-3xl px-6 text-base leading-relaxed">
          {copy.sections.map((section, index) => (
            <div key={section.title} className={index === 0 ? "" : "mt-12"}>
              <h2 className="font-display text-2xl font-semibold">
                {section.title}
              </h2>
              <p className="mt-4 text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "Preise — WebHealth Founding Agency Pilot",
  description:
    "Founding Agency Pilot: erster Monat kostenlos, danach 149 EUR/Monat. Self-Serve-Pläne bleiben für Einzelprojekte verfügbar.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    url: "/pricing",
    title: "Preise — WebHealth Founding Agency Pilot",
    description:
      "Founding Agency Pilot: erster Monat kostenlos, danach 149 EUR/Monat. Self-Serve-Pläne bleiben für Einzelprojekte verfügbar.",
    images: ["/og-image.png"],
  },
};

export default function PricingPage() {
  return (
    <div className="py-20">
      <PricingSection />
      <section className="mx-auto mt-20 max-w-3xl px-6 text-base leading-relaxed">
        <h2 className="font-display text-2xl font-semibold">
          Was im Pilot konkret passiert
        </h2>
        <p className="mt-4 text-muted-foreground">
          Im ersten Monat richten wir gemeinsam 3-10 Kunden-Websites ein und
          erstellen einen gebrandeten SEO-Monats-Snapshot: KPI-Veränderungen,
          Traffic-Drops, auffällige Seiten, Query-Chancen, Crawl-Hinweise und
          die wichtigsten nächsten Maßnahmen für dein Kundenmeeting.
        </p>

        <h2 className="mt-12 font-display text-2xl font-semibold">
          Warum die Agentur zuerst über den Pilot geht
        </h2>
        <p className="mt-4 text-muted-foreground">
          Der Pilot ist nicht einfach ein Checkout in ein weiteres Dashboard.
          Er testet mit passenden Agenturen den Schritt nach Ahrefs, Semrush,
          Screaming Frog oder Looker Studio: aus GSC-, GA4- und Crawl-Signalen
          entsteht ein priorisierter Maßnahmenplan, den du intern abarbeiten
          oder mit Kunden besprechen kannst.
        </p>

        <h2 className="mt-12 font-display text-2xl font-semibold">
          Zahlung nach dem kostenlosen ersten Monat
        </h2>
        <p className="mt-4 text-muted-foreground">
          Für den kostenlosen Pilot-Monat ist kein Stripe-Eintrag nötig. Wenn
          der Workflow nach dem ersten Monats-Snapshot passt, schicken wir den
          Zahlungslink für den Founder-Preis von 149 EUR/Monat. Normale
          Self-Serve-Pläne laufen weiterhin über Stripe und folgen den
          Bedingungen in unseren{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>
          .
        </p>

        <h2 className="mt-12 font-display text-2xl font-semibold">
          Fragen vor dem Pilot-Check?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Lies mehr über das Team und den Betrieb von WebHealth auf der{" "}
          <Link href="/about" className="underline">
            About-Seite
          </Link>
          , oder schreib an{" "}
          <a href="mailto:kontakt@devbrew.dev" className="underline">
            kontakt@devbrew.dev
          </a>{" "}
          .
        </p>
      </section>
    </div>
  );
}

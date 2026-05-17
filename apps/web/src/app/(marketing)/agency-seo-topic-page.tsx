import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, MousePointerClick } from "lucide-react";
import { AgencyComparisonSection } from "./agency-comparison-section";
import { AgencyHeader } from "./agency-header";
import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import {
  AGENCY_FAQ_ITEMS,
  AGENCY_HOME_COPY,
  AGENCY_TOPIC_FAQ_ITEMS,
} from "./agency-homepage.content";
import { getLocalizedValue } from "./agency-homepage.logic";
import { AgencyWorkspaceDemo } from "./agency-workspace-demo";
import { getAgencySeoTopicPath } from "./agency-seo.logic";
import {
  getAgencyResourcesPath,
  getCommercialPageBullets,
  getPrimaryClusterCta,
} from "./agency-content-cluster";

const TOPIC_COPY = {
  de: {
    eyebrow: "SEO Reporting Tool für Agenturen",
    title: "SEO Reporting Software für Agenturen: Monatsreports, die zu Maßnahmen werden.",
    lead:
      "WebHealth hilft Agenturen, GSC-, GA4- und Crawl-Daten nicht nur zu sammeln, sondern in Monats-Snapshots und priorisierte Maßnahmenlisten für Kundenmeetings zu übersetzen.",
    screenshotAlt:
      "Screenshot eines fiktiven WebHealth Agentur-Workspace mit Kundenübersicht und SEO-Maßnahmen",
    sample: "Fiktive Beispieldaten, keine Kundenergebnisse.",
    primary: "Demo ansehen",
    secondary: "Wissen lesen",
    heroPoints: getCommercialPageBullets("de"),
    problemTitle: "Warum Agentur-Reporting oft hängen bleibt",
    problemBody:
      "Viele SEO-Reports entstehen noch aus mehreren Exporten: Search Console für Klicks, Impressionen und Queries, GA4 für Sitzungen und Landingpages, ein Crawl für technische Fehler, danach manuelles Sortieren in Slides oder Tabellen. Das Ergebnis sieht nach Arbeit aus, beantwortet aber häufig nicht die wichtigste Kundenfrage: Was machen wir als Nächstes, und warum genau diese Reihenfolge?",
    workflowTitle: "So sieht der Workflow im Produkt aus",
    workflowLead:
      "Die Demo zeigt den Agenturfluss: erst Portfolio-Überblick, dann Klick in eine Kunden-Website, dann priorisierte Maßnahmen mit erwarteter Wirkung. Im Pilot wird dieser Ablauf founder-led eingerichtet, damit WebHealth an echten Agenturprozessen geschärft wird.",
    deliversTitle: "Was WebHealth im Pilot liefert",
    deliverables: [
      {
        title: "Monatlicher SEO-Snapshot",
        body: "Ein kompaktes Bild pro Kunde: KPI-Veränderungen, Seiten mit Bewegung, Query-Chancen und technische Crawl-Signale.",
      },
      {
        title: "Priorisierte Maßnahmenliste",
        body: "Eine klare Liste für Ihr Team, damit Reports nicht bei Charts enden, sondern in Umsetzung übergehen.",
      },
      {
        title: "Kundenmeeting-Vorbereitung",
        body: "Klare Zusammenfassung, was passiert ist, was wichtig ist und welche nächsten Schritte Sie erklären können.",
      },
    ],
    boundaryTitle: "Kein Ersatz für Ahrefs, Semrush oder Screaming Frog",
    boundaryBody:
      "WebHealth ersetzt keine professionelle SEO-Recherche, kein Keyword-Tool und keinen tiefen technischen Crawl. Es sitzt über diesen Signalen und macht aus wiederkehrendem Reporting eine Entscheidungsschicht für Agenturen: Was ist relevant, was ist dringend, was gehört ins nächste Kundenmeeting?",
    faqTitle: "Häufige Fragen zum Agentur-Pilot",
  },
  en: {
    eyebrow: "SEO Reporting Software for Agencies",
    title: "SEO reporting software for agencies that turns monthly reports into action.",
    lead:
      "WebHealth helps agencies turn GSC, GA4, and crawl data into a prioritized action plan for client meetings, not just another reporting archive.",
    screenshotAlt:
      "Screenshot of a fictional WebHealth agency workspace with client overview and SEO action items",
    sample: "Fictional sample data, not customer results.",
    primary: "Book a 12-min pilot fit check",
    secondary: "Read resources",
    heroPoints: getCommercialPageBullets("en"),
    problemTitle: "Why agency SEO reporting gets stuck",
    problemBody:
      "Many SEO reports are still assembled from several exports: Search Console for clicks, impressions, and queries, GA4 for sessions and landing pages, a crawl for technical issues, then manual sorting into slides or spreadsheets. The output looks like work, but often fails to answer the client question that matters most: what should we do next, and why in this order?",
    workflowTitle: "What the workflow looks like inside the product",
    workflowLead:
      "The demo shows the agency flow WebHealth is built around: start with a portfolio overview, open a client site, then review prioritized actions with expected impact. In the pilot, this flow is set up founder-led so we can learn from real agency processes before scaling it wider.",
    deliversTitle: "What WebHealth delivers in the pilot",
    deliverables: [
      {
        title: "Monthly SEO snapshot",
        body: "A compact view per client: KPI changes, moving pages, query opportunities, and technical crawl signals.",
      },
      {
        title: "Internal action backlog",
        body: "A prioritized list for your team, so reports do not stop at charts and can move into implementation.",
      },
      {
        title: "Client meeting prep",
        body: "A clear summary of what changed, what matters, and which next steps you can explain with confidence.",
      },
    ],
    boundaryTitle: "Not an Ahrefs, Semrush, or Screaming Frog replacement",
    boundaryBody:
      "WebHealth does not replace professional SEO research, keyword tooling, or deep technical crawling. It sits above those signals and turns recurring reporting into a decision layer for agencies: what is relevant, what is urgent, and what belongs in the next client meeting?",
    faqTitle: "Common questions about the agency pilot",
  },
} as const;

export function AgencySeoTopicPage({
  language,
}: {
  language: AgencyLandingLanguage;
}) {
  const copy = TOPIC_COPY[language];
  const faqItems = [...AGENCY_FAQ_ITEMS, ...AGENCY_TOPIC_FAQ_ITEMS];
  const primaryCta = getPrimaryClusterCta(language);
  const resourcesPath = getAgencyResourcesPath(language);

  return (
    <main className="bg-background text-foreground">
      <AgencyHeader
        language={language}
        languageSwitcherHrefByLanguage={{
          de: getAgencySeoTopicPath("de"),
          en: getAgencySeoTopicPath("en"),
        }}
      />
      <section className="border-b border-border bg-muted/30 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {copy.eyebrow}
              </p>
              <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {copy.lead}
              </p>
              <div className="mt-7 space-y-3">
                {copy.heroPoints.map((point) => (
                  <p key={point} className="flex items-start gap-3 text-sm leading-6">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{point}</span>
                  </p>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={primaryCta.href}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20"
                >
                  {primaryCta.label}
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </a>
                <Link
                  href={resourcesPath}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold"
                >
                  {copy.secondary}
                </Link>
              </div>
            </div>

            <figure className="rounded-[28px] border border-border bg-card p-3 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.32)]">
              <Image
                src="/agency-workspace-screenshot.png"
                width={1280}
                height={622}
                alt={copy.screenshotAlt}
                className="rounded-[20px] border border-border"
                priority
              />
              <figcaption className="mt-3 px-1 text-xs font-semibold text-muted-foreground">
                {copy.sample}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {language === "de" ? "Problem" : "Problem"}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {copy.problemTitle}
            </h2>
          </div>
          <p className="text-base leading-8 text-muted-foreground sm:text-lg">
            {copy.problemBody}
          </p>
        </div>
      </section>

      <section
        className="border-t border-border bg-muted/30 px-6 py-16"
        id="monatlicher-seo-report"
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            {language === "de"
              ? "Was zeigt ein monatlicher SEO-Report für Agenturen?"
              : "What does a monthly SEO report for agencies show?"}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {language === "de"
              ? "Ein nutzbarer Monatsreport beantwortet vier Fragen für das Kundenmeeting. Alles andere ist Datenballast."
              : "A useful monthly report answers four questions for the client meeting. Everything else is data clutter."}
          </p>
          <ul className="mt-6 space-y-4 text-base leading-7">
            <li>
              <strong>
                {language === "de" ? "Was hat sich verändert?" : "What changed?"}
              </strong>{" "}
              {language === "de"
                ? "KPI-Veränderungen aus GSC und GA4 zeigen, ob Klicks, Impressionen, Sitzungen oder Positionen wirklich Bewegung haben."
                : "GSC and GA4 deltas show whether clicks, impressions, sessions, or rankings actually moved."}
            </li>
            <li>
              <strong>
                {language === "de" ? "Welche Seiten haben verloren?" : "Which pages lost?"}
              </strong>{" "}
              {language === "de"
                ? "Seiten mit Traffic-Rückgang werden mit unterstützenden Analytics- und Crawl-Signalen geprüft."
                : "Pages with traffic drops are reviewed with supporting analytics and crawl signals."}
            </li>
            <li>
              <strong>
                {language === "de"
                  ? "Welche Queries sind nah an besseren Positionen?"
                  : "Which queries are close to better positions?"}
              </strong>{" "}
              {language === "de"
                ? "Near-Win-Queries und CTR-Lücken helfen, die nächsten Content- oder Snippet-Arbeiten zu priorisieren."
                : "Near-win queries and CTR gaps help prioritize the next content or snippet work."}
            </li>
            <li>
              <strong>
                {language === "de"
                  ? "Welche 3-5 Maßnahmen gehören in diese Woche?"
                  : "Which 3-5 actions belong in this week?"}
              </strong>{" "}
              {language === "de"
                ? "Der Snapshot endet mit einer reviewbaren Maßnahmenliste, nicht mit einer reinen Diagrammsammlung."
                : "The snapshot ends with a reviewable backlog, not just a collection of charts."}
            </li>
          </ul>
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            {language === "de"
              ? "WebHealth ordnet GSC-, GA4- und Crawl-Daten in genau dieser Reihenfolge: von Veränderung zur priorisierten Maßnahme."
              : "WebHealth orders GSC, GA4, and crawl data in that sequence: from change to prioritized action."}
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <MousePointerClick className="size-4" aria-hidden="true" />
                {language === "de" ? "Interaktive Demo" : "Interactive demo"}
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {copy.workflowTitle}
              </h2>
            </div>
            <div>
              <p className="text-base leading-8 text-muted-foreground">
                {copy.workflowLead}
              </p>
              <p className="mt-4 inline-flex rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                {copy.sample}
              </p>
            </div>
          </div>

          <AgencyWorkspaceDemo language={language} />
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {language === "de" ? "Pilot-Output" : "Pilot output"}
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {copy.deliversTitle}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {copy.deliverables.map((item) => (
              <article key={item.title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <h3 className="font-display text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <AgencyComparisonSection language={language} />

      <section className="border-y border-border bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {copy.boundaryTitle}
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
            {copy.boundaryBody}
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            {copy.faqTitle}
          </h2>
          <div className="mt-8 grid gap-4">
            {faqItems.map((item) => (
              <article key={item.question.en} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-display text-lg font-semibold">
                  {getLocalizedValue(item.question, language)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {getLocalizedValue(item.answer, language)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 px-6 py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              {language === "de"
                ? "Machen Sie aus dem nächsten Monatsreport eine priorisierte Maßnahmenliste."
                : AGENCY_HOME_COPY.closingCta.title[language]}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {language === "de"
                ? "Die Demo zeigt, wie WebHealth GSC-, GA4- und Crawl-Signale zu einem Agentur-Workflow für das nächste Kunden-Update verdichtet."
                : AGENCY_HOME_COPY.closingCta.subtitle[language]}
            </p>
          </div>
          <a
            href={primaryCta.href}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
          >
            {primaryCta.label}
          </a>
        </div>
      </section>
    </main>
  );
}

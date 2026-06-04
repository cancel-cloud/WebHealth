import type { Metadata } from "next";
import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import {
  AGENCY_PRODUCTION_BASE_URL,
  getAgencyDemoPath,
  getAgencyHomePath,
  getAgencySeoTopicPath,
} from "./agency-seo.logic";

export type ClusterPageKind = "hub" | "article";

export type ClusterArticleSlug =
  | "seo-reporting-agenturen-monatsreport"
  | "seo-massnahmen-priorisieren-backlog-agentur"
  | "gsc-ga4-agentur-reporting-monatscall";

export type ClusterArticle = {
  slug: ClusterArticleSlug;
  category: string;
  title: Record<AgencyLandingLanguage, string>;
  metaTitle: Record<AgencyLandingLanguage, string>;
  description: Record<AgencyLandingLanguage, string>;
  intro: Record<AgencyLandingLanguage, string>;
  date: string;
  sections: Array<{
    title: Record<AgencyLandingLanguage, string>;
    body: Record<AgencyLandingLanguage, string[]>;
  }>;
  mistakes: Record<AgencyLandingLanguage, string[]>;
  workflow: Record<AgencyLandingLanguage, string[]>;
  comparison?: {
    title: Record<AgencyLandingLanguage, string>;
    intro: Record<AgencyLandingLanguage, string>;
    items: Array<{
      title: Record<AgencyLandingLanguage, string>;
      question: Record<AgencyLandingLanguage, string>;
      signals: Record<AgencyLandingLanguage, string[]>;
    }>;
  };
  checklist?: {
    title: Record<AgencyLandingLanguage, string>;
    intro: Record<AgencyLandingLanguage, string>;
    stages: Array<{
      title: Record<AgencyLandingLanguage, string>;
      description: Record<AgencyLandingLanguage, string>;
      items: Record<AgencyLandingLanguage, string[]>;
    }>;
  };
  webhealth: Record<AgencyLandingLanguage, string>;
  faqs: Array<{
    question: Record<AgencyLandingLanguage, string>;
    answer: Record<AgencyLandingLanguage, string>;
  }>;
  sources: Array<{
    label: string;
    href: string;
  }>;
  cta: {
    eyebrow: Record<AgencyLandingLanguage, string>;
    title: Record<AgencyLandingLanguage, string>;
    description: Record<AgencyLandingLanguage, string>;
    secondaryLabel: Record<AgencyLandingLanguage, string>;
    secondaryHref: Record<AgencyLandingLanguage, string>;
  };
};

export const CLUSTER_ARTICLE_SLUGS: ClusterArticleSlug[] = [
  "seo-reporting-agenturen-monatsreport",
  "seo-massnahmen-priorisieren-backlog-agentur",
  "gsc-ga4-agentur-reporting-monatscall",
];

export const CLUSTER_ARTICLES: ClusterArticle[] = [
  {
    slug: "seo-reporting-agenturen-monatsreport",
    category: "SEO Reporting",
    date: "2026-05-17",
    title: {
      de: "SEO-Reporting für Agenturen: Was ein Monatsreport wirklich beantworten muss",
      en: "SEO Reporting for Agencies: What a Monthly Report Must Actually Answer",
    },
    metaTitle: {
      de: "SEO-Reporting für Agenturen im Monatsreport",
      en: "SEO Reporting for Agencies in Monthly Reports",
    },
    description: {
      de: "Was ein SEO-Monatsreport für Agenturen wirklich beantworten muss: Veränderungen, Ursachen, Prioritäten und nächste Schritte für den Kundencall.",
      en: "What a monthly SEO report for agencies must answer: changes, causes, priorities, and next steps for the client call.",
    },
    intro: {
      de: "Die meisten SEO-Monatsreports scheitern nicht an fehlenden Daten. Sie scheitern daran, dass nach vielen Charts noch unklar ist, was sich wirklich verändert hat, warum es wichtig ist und was im nächsten Monat konkret passieren soll.",
      en: "Most monthly SEO reports do not fail because data is missing. They fail because, after many charts, it is still unclear what changed, why it matters, and what should happen next month.",
    },
    sections: [
      {
        title: {
          de: "Was ein Monatsreport zwingend beantworten sollte",
          en: "What a monthly report must answer",
        },
        body: {
          de: [
            "Ein brauchbarer Monatsreport beantwortet drei Fragen: Was hat sich verändert? Warum ist das passiert? Was tun wir als Nächstes? Ohne diese Reihenfolge bleibt Reporting eine Datensammlung, aber keine Vorbereitung für Entscheidungen.",
            "Für die Veränderung reichen wenige belastbare Signale: Klicks, Impressionen, CTR und durchschnittliche Position aus der Search Console sowie organische Landingpage-Performance und Key Events aus GA4. Die Erklärung entsteht erst, wenn diese Signale mit Seiten, Queries, Indexierung und Crawl-Hinweisen abgeglichen werden.",
          ],
          en: [
            "A useful monthly report answers three questions: what changed, why did it happen, and what do we do next? Without that sequence, reporting remains a data collection exercise instead of decision preparation.",
            "For the change layer, a few reliable signals are usually enough: clicks, impressions, CTR, and average position from Search Console, plus organic landing page performance and key events from GA4. The explanation appears only when those signals are checked against pages, queries, indexing, and crawl findings.",
          ],
        },
      },
      {
        title: {
          de: "Ein konkretes Agenturbeispiel",
          en: "A concrete agency example",
        },
        body: {
          de: [
            "Nehmen Sie einen B2B-SaaS-Kunden mit mehreren organischen Demo-Landingpages. Impressionen bleiben stabil, Klicks sinken, die CTR fällt auf mehreren Seiten und organische Key Events gehen in GA4 zurück. Die Aussage ist dann nicht einfach: SEO-Performance ist rückläufig.",
            "Die bessere Aussage lautet: Sichtbarkeit ist noch vorhanden, aber die Einlösung in Klicks und Demo-Aktionen wird schwächer. Priorität hat zuerst Snippet- und Intent-Prüfung auf den betroffenen Seiten, nicht sofort ein neues Content-Paket.",
          ],
          en: [
            "Take a B2B SaaS client with several organic demo landing pages. Impressions stay stable, clicks fall, CTR drops on multiple pages, and organic key events decline in GA4. The useful conclusion is not simply: SEO performance is down.",
            "A better conclusion is: visibility is still present, but the conversion from impressions into clicks and demo actions is weakening. The first priority is snippet and intent review on the affected pages, not an immediate new content package.",
          ],
        },
      },
    ],
    mistakes: {
      de: [
        "Den Report um das Tool herum bauen, statt um die Kundenentscheidung.",
        "KPI-Listen ohne Stakeholderlogik in den Kundencall übernehmen.",
        "Reporting und Maßnahmenliste trennen, sodass die eigentliche Arbeit in E-Mails oder Tickets verschwindet.",
      ],
      en: [
        "Building the report around the tool instead of the client decision.",
        "Bringing KPI lists into the client call without stakeholder context.",
        "Separating reporting from the action list, so the real work disappears into emails or tickets.",
      ],
    },
    workflow: {
      de: [
        "Zu Monatsbeginn Veränderungen auf den wichtigsten organischen Landingpages und Ziel-Queries prüfen.",
        "Nur auffällige Abweichungen vertiefen: Klickverluste, CTR-Einbrüche, Positionssprünge, organische Key-Event-Rückgänge oder neue Indexierungsprobleme.",
        "Jede relevante Beobachtung in Status, Ursache und nächste Maßnahme verdichten.",
        "Die Report-Sektion direkt in einen Eintrag der priorisierten Maßnahmenliste überführen.",
      ],
      en: [
        "At the start of the month, review changes on the most important organic landing pages and target queries.",
        "Investigate only meaningful anomalies: click losses, CTR drops, ranking jumps, organic key event declines, or new indexing problems.",
        "Condense each relevant observation into status, cause, and next action.",
        "Turn the report section directly into an item in the prioritized action list.",
      ],
    },
    webhealth: {
      de: "WebHealth passt genau in die Lücke zwischen Datenquelle und Entscheidung. GSC, GA4, Crawl-Daten und klassische SEO-Tools liefern Rohdaten oder Detailanalysen. WebHealth ordnet diese Signale zu einem Monats-Snapshot und einer priorisierten Maßnahmenliste für das nächste Kundenmeeting.",
      en: "WebHealth fits into the gap between data source and decision. GSC, GA4, crawl data, and classic SEO tools provide raw data or detailed analysis. WebHealth organizes those signals into a monthly snapshot and prioritized action list for the next client meeting.",
    },
    faqs: [
      {
        question: {
          de: "Was gehört nicht in jeden SEO-Monatsreport?",
          en: "What does not belong in every monthly SEO report?",
        },
        answer: {
          de: "Alles, was keinen Entscheidungswert für den Kunden hat: rohe Crawl-Exports, lange Keyword-Listen ohne Kontext und Tool-Scores ohne Priorisierung.",
          en: "Anything that does not help the client make a decision: raw crawl exports, long keyword lists without context, and tool scores without prioritization.",
        },
      },
      {
        question: {
          de: "Wie viele KPIs reichen für einen Agentur-Monatsreport?",
          en: "How many KPIs are enough for an agency monthly report?",
        },
        answer: {
          de: "Wenige, aber belastbare KPIs genügen meist: GSC-Sichtbarkeitssignale, organische Landingpage-Performance, Key Events aus GA4 und die wichtigsten technischen Blocker.",
          en: "A small set of reliable KPIs is usually enough: GSC visibility signals, organic landing page performance, GA4 key events, and the most important technical blockers.",
        },
      },
      {
        question: {
          de: "Soll ein Monatsreport ein Dashboard ersetzen?",
          en: "Should a monthly report replace a dashboard?",
        },
        answer: {
          de: "Nein. Dashboards sind stark für Monitoring. Der Monatsreport ist stärker für Rückblick, Interpretation und nächste Maßnahmen.",
          en: "No. Dashboards are useful for monitoring. The monthly report is better for review, interpretation, and next actions.",
        },
      },
    ],
    sources: [
      {
        label: "Google Search Console Help: Performance report",
        href: "https://support.google.com/webmasters/answer/7576553",
      },
      {
        label: "Google Search Console Help: Page indexing report",
        href: "https://support.google.com/webmasters/answer/7440203",
      },
      {
        label: "Google Analytics Help: Search Console integration",
        href: "https://support.google.com/analytics/answer/10737381",
      },
    ],
    cta: {
      eyebrow: { de: "WebHealth Demo", en: "WebHealth demo" },
      title: {
        de: "Sehen Sie, wie aus SEO-Daten ein Monats-Snapshot mit Prioritäten wird.",
        en: "See how SEO data becomes a monthly snapshot with priorities.",
      },
      description: {
        de: "WebHealth verbindet GSC, GA4 und Crawl-Signale zu einem klareren Reporting-Workflow für kleine Agenturen.",
        en: "WebHealth connects GSC, GA4, and crawl signals into a clearer reporting workflow for small agencies.",
      },
      secondaryLabel: {
        de: "SEO Reporting Tool ansehen",
        en: "View the SEO reporting page",
      },
      secondaryHref: {
        de: "/de/seo-reporting-tool-agenturen",
        en: "/en/seo-reporting-software-agencies",
      },
    },
  },
  {
    slug: "seo-massnahmen-priorisieren-backlog-agentur",
    category: "SEO Priorisierung",
    date: "2026-05-17",
    title: {
      de: "SEO-Maßnahmen priorisieren für Agenturen: So wird aus Reporting eine umsetzbare Maßnahmenliste",
      en: "Prioritizing SEO Actions for Agencies: Turning Reports into an Action List",
    },
    metaTitle: {
      de: "SEO-Maßnahmen priorisieren als Agentur",
      en: "Prioritize SEO Actions for Agency Clients",
    },
    description: {
      de: "So priorisieren Agenturen SEO-Maßnahmen mit Wirkung, Aufwand, Evidenz und Dringlichkeit statt mit Tool-Scores und Bauchgefühl.",
      en: "How agencies prioritize SEO actions by impact, effort, evidence, and urgency instead of tool scores and gut feeling.",
    },
    intro: {
      de: "Das eigentliche Problem im SEO ist selten zu wenig Analyse. Das Problem ist fast immer: zu viele mögliche Maßnahmen und zu wenig begründete Reihenfolge.",
      en: "The real SEO problem is rarely too little analysis. It is almost always too many possible actions and not enough justified sequencing.",
    },
    sections: [
      {
        title: {
          de: "Weg von Tool-Schweregraden, hin zu Arbeitsprioritäten",
          en: "From tool severity to work priorities",
        },
        body: {
          de: [
            "Ein Tool kann einen Fehler als kritisch markieren, ohne zu wissen, ob die betroffene Seite organische Nachfrage, Leads oder Kundenwert trägt. Agentur-Priorisierung braucht deshalb andere Kriterien.",
            "Die vier brauchbaren Kriterien sind Evidenz, Impact, Aufwand und Dringlichkeit. Gibt es ein klares Signal? Betrifft es wichtige Seitentypen? Wie schwer ist die Umsetzung? Verhindert das Problem gerade Sichtbarkeit, Crawling, Indexierung oder Conversion?",
          ],
          en: [
            "A tool can mark an issue as critical without knowing whether the affected page carries organic demand, leads, or customer value. Agency prioritization needs a different set of criteria.",
            "The four useful criteria are evidence, impact, effort, and urgency. Is there a clear signal? Does it affect important page types? How hard is implementation? Is the issue currently blocking visibility, crawling, indexing, or conversion?",
          ],
        },
      },
      {
        title: {
          de: "Welche Signale zuerst geprüft werden sollten",
          en: "Which signals should be reviewed first",
        },
        body: {
          de: [
            "Technische Themen mit direktem Indexierungs- oder Zugriffsbezug gehören meist nach vorn: noindex auf wichtigen Templates, robots-Blockaden, Canonical-Konflikte oder neue Gründe für fehlende Indexierung im Page Indexing Report.",
            "Danach folgen Themen, die Performance auf wertvollen Seitentypen drücken: interne Verlinkung auf Money-Pages, Snippet-Probleme mit CTR-Verlust, fehlerhafte Redirects oder dünne Seiten mit klarer Nachfrage.",
          ],
          en: [
            "Technical topics with direct indexing or access impact usually move to the front: noindex on important templates, robots blocks, canonical conflicts, or new reasons for missing indexing in the Page Indexing report.",
            "After that come issues that reduce performance on valuable page types: internal links to money pages, snippet problems with CTR loss, faulty redirects, or thin pages with clear demand.",
          ],
        },
      },
    ],
    mistakes: {
      de: [
        "Tool-Prioritäten ungeprüft übernehmen.",
        "Housekeeping und wachstumsrelevante SEO-Arbeit in dieselbe Prioritätenliste werfen.",
        "Empfehlungen ohne Owner, Termin oder Rückbezug zum Report formulieren.",
      ],
      en: [
        "Accepting tool priorities without review.",
        "Mixing housekeeping and growth-relevant SEO work in the same priority list.",
        "Writing recommendations without owner, timing, or connection back to the report.",
      ],
    },
    workflow: {
      de: [
        "Relevante Signale aus GSC, GA4, Crawl und ergänzenden SEO-Tools sammeln.",
        "Findings nach Seitentyp oder Problemtyp clustern.",
        "Jede Maßnahme mit Evidenz, Impact, Aufwand und Dringlichkeit bewerten.",
        "Drei bis fünf priorisierte Maßnahmen für den Kunden und eine operative Liste fürs Team ableiten.",
      ],
      en: [
        "Collect relevant signals from GSC, GA4, crawl data, and supporting SEO tools.",
        "Cluster findings by page type or problem type.",
        "Score every action by evidence, impact, effort, and urgency.",
        "Create three to five prioritized actions for the client and an operational list for the team.",
      ],
    },
    webhealth: {
      de: "WebHealth macht Reporting nicht zum Endprodukt. Der Monats-Snapshot wird zum Ausgangspunkt für den nächsten Arbeitsmonat: Signale werden gesammelt, eingeordnet und als priorisierte Maßnahmenliste reviewbar gemacht.",
      en: "WebHealth does not treat reporting as the final output. The monthly snapshot becomes the starting point for the next month of work: signals are collected, interpreted, and turned into a reviewable prioritized action list.",
    },
    faqs: [
      {
        question: {
          de: "Wie viele Maßnahmen sollten im Monatsplan stehen?",
          en: "How many actions should be in the monthly plan?",
        },
        answer: {
          de: "Lieber drei bis fünf priorisierte Punkte als zwanzig offene Empfehlungen ohne klare Reihenfolge.",
          en: "Three to five prioritized items are better than twenty open recommendations without a clear order.",
        },
      },
      {
        question: {
          de: "Sind technische Issues automatisch höher priorisiert?",
          en: "Are technical issues automatically higher priority?",
        },
        answer: {
          de: "Nur wenn sie Zugriff, Rendering, Indexierung oder Leistung wichtiger Seiten beeinträchtigen.",
          en: "Only when they affect access, rendering, indexing, or performance of important pages.",
        },
      },
      {
        question: {
          de: "Soll man Tool-Prioritäten ignorieren?",
          en: "Should tool priorities be ignored?",
        },
        answer: {
          de: "Nein. Sie sind ein guter Startpunkt, aber sie sollten nie ungeprüft zur Arbeitsreihenfolge werden.",
          en: "No. They are a useful starting point, but they should never become the work order without review.",
        },
      },
    ],
    sources: [
      {
        label: "Google Search Central: robots.txt introduction",
        href: "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
      },
      {
        label: "Google Search Central: canonicalization",
        href: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
      },
      {
        label: "Google Search Console Help: URL Inspection Tool",
        href: "https://support.google.com/webmasters/answer/9012289",
      },
    ],
    cta: {
      eyebrow: { de: "Priorisierung mit WebHealth", en: "Prioritization with WebHealth" },
      title: {
        de: "Vergleichen Sie Ihren aktuellen SEO-Workflow mit WebHealth.",
        en: "Compare your current SEO workflow with WebHealth.",
      },
      description: {
        de: "Die Demo zeigt, wie Monats-Snapshots und priorisierte Maßnahmenliste im Agenturkontext zusammenlaufen.",
        en: "The demo shows how monthly snapshots and prioritized action lists come together in an agency workflow.",
      },
      secondaryLabel: {
        de: "Monatsreport-Workflow lesen",
        en: "Read the monthly reporting workflow",
      },
      secondaryHref: {
        de: "/de/wissen/seo-reporting-agenturen-monatsreport",
        en: "/en/resources/seo-reporting-agenturen-monatsreport",
      },
    },
  },
  {
    slug: "gsc-ga4-agentur-reporting-monatscall",
    category: "GSC + GA4 Reporting",
    date: "2026-06-04",
    title: {
      de: "GSC + GA4 im Agentur-Reporting: Welche Daten wirklich in den Monatscall gehören",
      en: "GSC + GA4 for Agency Reporting: What Belongs in the Monthly Client Call",
    },
    metaTitle: {
      de: "GSC + GA4 im Agentur-Reporting",
      en: "GSC + GA4 for Agency Reporting",
    },
    description: {
      de: "Welche GSC- und GA4-Daten gehören wirklich in den SEO-Monatscall? Ein pragmatischer Leitfaden für Agenturen mit mehreren Kunden.",
      en: "Which GSC and GA4 data belongs in the monthly SEO client call? A practical guide for agencies managing multiple clients.",
    },
    intro: {
      de: "Viele Agenturen packen in den Monatscall alles hinein, was GSC und GA4 hergeben. Das Ergebnis: zu viele Kennzahlen, falsche Vergleiche und zu wenig Klarheit. Der bessere Ansatz gibt beiden Systemen einen klaren Job.",
      en: "Many agencies bring everything GSC and GA4 can provide into the monthly client call. The result is too many metrics, misleading comparisons, and too little clarity. A better approach gives each system a clear job.",
    },
    sections: [
      {
        title: {
          de: "Welchen Job GSC im Monatscall hat",
          en: "The job GSC has in the monthly call",
        },
        body: {
          de: [
            "Google Search Console beantwortet vor allem die Frage: Wie sichtbar war die Website in der Google-Suche und wie gut wurde diese Sichtbarkeit in Klicks umgewandelt? Dafür sind Klicks, Impressionen, CTR und durchschnittliche Position die zentralen Signale.",
            "In den Call gehören deshalb nicht pauschal alle Top-Queries. Relevant sind Veränderungen auf wichtigen Seitentypen, CTR-Bewegungen bei strategischen Queries, Positionstrends auf Seiten mit Geschäftswert und auffällige Einbrüche gegenüber dem Vergleichszeitraum.",
          ],
          en: [
            "Google Search Console primarily answers: how visible was the website in Google Search, and how effectively did that visibility turn into clicks? Clicks, impressions, CTR, and average position are the central signals.",
            "The call therefore does not need every top query. It needs changes on important page types, CTR movement on strategic queries, position trends on commercially valuable pages, and notable declines against the comparison period.",
          ],
        },
      },
      {
        title: {
          de: "Welchen Job GA4 im Monatscall hat",
          en: "The job GA4 has in the monthly call",
        },
        body: {
          de: [
            "GA4 beantwortet die nächste Frage: Was passiert nach dem Klick? Für den Monatscall sind organische Landingpages, Sessions, Nutzer, relevante Events und idealerweise sauber definierte Key Events wichtiger als eine vollständige Analytics-Tour.",
            "Key Events sind eine GA4-Best-Practice für besonders wichtige Geschäftshandlungen. Prüfen Sie diese gemeinsam mit Landingpages und Akquisitionsberichten. Beachten Sie dabei, dass User Acquisition und Traffic Acquisition unterschiedliche Scopes haben und nicht als gleichwertige Ansichten verglichen werden sollten.",
          ],
          en: [
            "GA4 answers the next question: what happens after the click? For the monthly call, organic landing pages, sessions, users, relevant events, and ideally well-defined Key Events matter more than a complete analytics tour.",
            "Key Events are a GA4 best practice for business-critical actions. Review them alongside landing pages and acquisition reports. User Acquisition and Traffic Acquisition use different scopes and should not be treated as equivalent views.",
          ],
        },
      },
      {
        title: {
          de: "Was nicht in den Monatscall gehört",
          en: "What does not belong in the monthly call",
        },
        body: {
          de: [
            "Nicht hilfreich sind umfangreiche Channel-Tabellen ohne konkrete SEO-Frage, Events ohne Geschäftsbedeutung oder der Versuch, GSC-Klicks und GA4-Sessions exakt gleichzusetzen.",
            "Beide Systeme messen unterschiedliche Schritte mit unterschiedlichen Definitionen und Verarbeitungslogiken. GSC erklärt Auffindbarkeit und Klicks. GA4 erklärt Verhalten und Ergebnisse nach dem Klick. Eine Abweichung ist deshalb nicht automatisch ein Messfehler.",
          ],
          en: [
            "Large channel tables without a concrete SEO question, events without business meaning, and attempts to make GSC clicks exactly equal GA4 sessions are not useful in the monthly call.",
            "The systems measure different steps with different definitions and processing logic. GSC explains discovery and clicks. GA4 explains behavior and outcomes after the click. A discrepancy is therefore not automatically a measurement error.",
          ],
        },
      },
      {
        title: {
          de: "Ein Beispiel aus der öffentlichen WebHealth-Demo",
          en: "An example from the public WebHealth demo",
        },
        body: {
          de: [
            "Bei der fiktiven Acme Bakery steigen beispielsweise Impressionen und GA4-Sessions, während das wichtige Ereignis „Checkout gestartet“ auf demselben Niveau bleibt. Daraus folgt weder pauschal „SEO läuft gut“ noch „Das Tracking ist kaputt“.",
            "Die belastbarere Interpretation lautet: Mehr Menschen finden und besuchen die Website, doch das gewünschte Verhalten wächst nicht mit. Als Nächstes prüft die Agentur die betroffenen Landingpages, ergänzt bei Bedarf passende Crawl-Hinweise und formuliert daraus eine klar begründete Maßnahme für die Maßnahmenliste.",
          ],
          en: [
            "For the fictional Acme Bakery, impressions or sessions can rise while an important checkout-start event stays flat. The right conclusion is neither simply “SEO is doing well” nor “Analytics is broken.”",
            "A more useful interpretation is that reach or visits are moving, but the desired behavior is not growing at the same rate. The next step is to review the affected landing pages, add relevant crawl evidence, and formulate a reviewable action.",
          ],
        },
      },
    ],
    comparison: {
      title: {
        de: "GSC und GA4 haben unterschiedliche Jobs",
        en: "GSC and GA4 have different jobs",
      },
      intro: {
        de: "Teilen Sie die Systeme nach der Frage auf, die sie im Monatscall beantworten sollen.",
        en: "Separate the systems by the question each should answer in the monthly client call.",
      },
      items: [
        {
          title: { de: "Google Search Console", en: "Google Search Console" },
          question: {
            de: "Wie wurden wir gefunden und in Klicks umgewandelt?",
            en: "How were we discovered and converted into clicks?",
          },
          signals: {
            de: [
              "Klicks, Impressionen, CTR und durchschnittliche Position",
              "Strategische Queries und wichtige Seitentypen",
              "Veränderungen gegenüber dem Vergleichszeitraum",
            ],
            en: [
              "Clicks, impressions, CTR, and average position",
              "Strategic queries and important page types",
              "Changes against the comparison period",
            ],
          },
        },
        {
          title: { de: "Google Analytics 4", en: "Google Analytics 4" },
          question: {
            de: "Was geschah nach dem Klick?",
            en: "What happened after the click?",
          },
          signals: {
            de: [
              "Organische Landingpages, Sessions und Nutzer",
              "Relevante Events und idealerweise Key Events",
              "Traffic Acquisition passend zur SEO-Frage",
            ],
            en: [
              "Organic landing pages, sessions, and users",
              "Relevant events and ideally Key Events",
              "Traffic Acquisition matched to the SEO question",
            ],
          },
        },
      ],
    },
    checklist: {
      title: {
        de: "Monatscall-Checkliste: drei Stufen statt Analytics-Rundgang",
        en: "Monthly call checklist: three stages instead of an analytics tour",
      },
      intro: {
        de: "Nutzen Sie diese Reihenfolge, um den Call auf Veränderungen, Erklärung und nächste Arbeit zu konzentrieren.",
        en: "Use this sequence to keep the call focused on change, explanation, and next work.",
      },
      stages: [
        {
          title: { de: "1. GSC: Veränderung erkennen", en: "1. GSC: identify the change" },
          description: {
            de: "Beginnen Sie bei Sichtbarkeit und Klicks auf wichtigen Seiten und Queries.",
            en: "Start with visibility and clicks on important pages and queries.",
          },
          items: {
            de: [
              "Größte relevante Klick- und Impressionen-Veränderungen auswählen",
              "CTR- und Positionsbewegungen auf strategischen Seiten prüfen",
              "Nur Abweichungen mit Kundenrelevanz in den Call aufnehmen",
            ],
            en: [
              "Select the largest relevant click and impression changes",
              "Review CTR and position movement on strategic pages",
              "Bring only client-relevant changes into the call",
            ],
          },
        },
        {
          title: { de: "2. GA4: Wirkung einordnen", en: "2. GA4: interpret the outcome" },
          description: {
            de: "Lesen Sie dieselben Landingpages gegen Verhalten und Geschäftsergebnis.",
            en: "Read the same landing pages against behavior and business outcomes.",
          },
          items: {
            de: [
              "Organische Landingpages, Sessions und Nutzer vergleichen",
              "Relevante Events und vorhandene Key Events prüfen",
              "Keine 1:1-Gleichheit zwischen GSC-Klicks und GA4-Sessions erwarten",
            ],
            en: [
              "Compare organic landing pages, sessions, and users",
              "Review relevant events and available Key Events",
              "Do not expect a one-to-one match between GSC clicks and GA4 sessions",
            ],
          },
        },
        {
          title: {
            de: "3. Entscheidung: Maßnahmenliste festlegen",
            en: "3. Decision: define the action list",
          },
          description: {
            de: "Nutzen Sie Crawl-Hinweise nur dort, wo sie eine ausgewählte Abweichung erklären helfen.",
            en: "Use crawl evidence only where it helps explain a selected anomaly.",
          },
          items: {
            de: [
              "Interpretation in einem verständlichen Satz festhalten",
              "Bei Bedarf Crawl-Evidenz zur Diagnose ergänzen",
              "Drei bis fünf priorisierte Maßnahmen mit Owner und Ziel formulieren",
            ],
            en: [
              "Capture the interpretation in one understandable sentence",
              "Add crawl evidence where needed for diagnosis",
              "Define three to five prioritized actions with owner and goal",
            ],
          },
        },
      ],
    },
    mistakes: {
      de: [
        "GSC und GA4 als konkurrierende Wahrheiten behandeln.",
        "Den Monatscall mit Akquisitionsdetails überladen, obwohl die SEO-Frage auf Landingpage- und Query-Ebene liegt.",
        "User Acquisition und Traffic Acquisition ohne Beachtung ihrer unterschiedlichen Scopes vergleichen.",
        "Aus einer Abweichung sofort eine Ursache ableiten, ohne Landingpage oder unterstützende Crawl-Evidenz zu prüfen.",
      ],
      en: [
        "Treating GSC and GA4 as competing versions of truth.",
        "Overloading the call with acquisition detail when the SEO question sits at landing-page and query level.",
        "Comparing User Acquisition and Traffic Acquisition without accounting for their different scopes.",
        "Assigning a cause immediately without reviewing the landing page or supporting crawl evidence.",
      ],
    },
    workflow: {
      de: [
        "GSC auf relevante Seiten- und Query-Veränderungen prüfen.",
        "Dieselben Landingpages in GA4 gegen Sessions, Nutzer, relevante Events und vorhandene Key Events lesen.",
        "Ausgewählte Auffälligkeiten bei Bedarf mit Crawl-Evidenz diagnostisch ergänzen.",
        "Interpretation und nächste Arbeit in eine priorisierte Maßnahmenliste überführen.",
      ],
      en: [
        "Review GSC for relevant page and query changes.",
        "Read the same landing pages in GA4 against sessions, users, relevant events, and available Key Events.",
        "Add crawl evidence to selected anomalies where it supports diagnosis.",
        "Turn the interpretation and next work into a prioritized action list.",
      ],
    },
    webhealth: {
      de: "WebHealth nutzt heute GSC-Signale, GA4-Reportingdaten wie Sessions, Nutzer, Landingpages und Events sowie Crawl-Hinweise. Daraus entsteht eine Entscheidungsebene für Monats-Snapshots und priorisierte Maßnahmenlisten. Die fachliche Auswahl geschäftskritischer Ereignisse bleibt Teil des Agentur-Workflows.",
      en: "WebHealth currently uses GSC signals, GA4 reporting data such as sessions, users, landing pages, and events, plus crawl findings. It turns those inputs into a decision layer for monthly snapshots and prioritized action lists. Selecting business-critical events remains part of the agency workflow.",
    },
    faqs: [
      {
        question: {
          de: "Warum stimmen GSC-Klicks und GA4-Sessions nicht exakt überein?",
          en: "Why do GSC clicks and GA4 sessions not match exactly?",
        },
        answer: {
          de: "Weil beide Systeme unterschiedliche Schritte mit unterschiedlichen Definitionen und Verarbeitungslogiken messen. Eine Abweichung ist deshalb nicht automatisch ein Fehler.",
          en: "Because the systems measure different steps with different definitions and processing logic. A discrepancy is therefore not automatically an error.",
        },
      },
      {
        question: {
          de: "Welche GA4-Reports sind für SEO besonders hilfreich?",
          en: "Which GA4 reports are especially useful for SEO?",
        },
        answer: {
          de: "Der Landingpage-Report, relevante Events beziehungsweise Key Events und je nach Fragestellung Traffic Acquisition. User Acquisition beantwortet eine andere, nutzerbezogene Frage.",
          en: "The Landing Page report, relevant events or Key Events, and Traffic Acquisition where appropriate. User Acquisition answers a different, user-scoped question.",
        },
      },
      {
        question: {
          de: "Wie weit reichen Search-Console-Daten in GA4 zurück?",
          en: "How far back does Search Console data in GA4 go?",
        },
        answer: {
          de: "Die Search-Console-Integration stellt in GA4 maximal 16 Monate bereit und die Daten sind typischerweise etwa 48 Stunden verzögert.",
          en: "The Search Console integration provides a maximum of 16 months in GA4, and the data is typically delayed by about 48 hours.",
        },
      },
      {
        question: {
          de: "Kann man Search-Console-Metriken in GA4 frei kombinieren?",
          en: "Can Search Console metrics be freely combined in GA4?",
        },
        answer: {
          de: "Nein. Google erlaubt nur ausgewählte Analytics-Dimensionen für die Kombination mit Search-Console-Metriken.",
          en: "No. Google allows only selected Analytics dimensions to be combined with Search Console metrics.",
        },
      },
    ],
    sources: [
      {
        label: "Google Analytics Help: Search Console integration",
        href: "https://support.google.com/analytics/answer/10737381",
      },
      {
        label: "Google Search Console Help: Performance report",
        href: "https://support.google.com/webmasters/answer/7576553",
      },
      {
        label: "Google Analytics Help: Key Events",
        href: "https://support.google.com/analytics/answer/9267568",
      },
      {
        label: "Google Analytics Help: Landing Page report",
        href: "https://support.google.com/analytics/answer/12931766",
      },
      {
        label: "Google Analytics Help: Acquisition reports",
        href: "https://support.google.com/analytics/answer/11080067",
      },
    ],
    cta: {
      eyebrow: { de: "GSC + GA4 mit WebHealth", en: "GSC + GA4 with WebHealth" },
      title: {
        de: "Vergleichen Sie Ihre GSC- und GA4-Report-Logik mit dem WebHealth-Workflow.",
        en: "Compare your GSC and GA4 reporting logic with the WebHealth workflow.",
      },
      description: {
        de: "Die Demo zeigt, wie ausgewählte GSC-, GA4- und Crawl-Signale in einen Monats-Snapshot und eine priorisierte Maßnahmenliste übergehen.",
        en: "The demo shows how selected GSC, GA4, and crawl signals become a monthly snapshot and prioritized action list.",
      },
      secondaryLabel: {
        de: "Monatsreport-Artikel lesen",
        en: "Read the monthly reporting article",
      },
      secondaryHref: {
        de: "/de/wissen/seo-reporting-agenturen-monatsreport",
        en: "/en/resources/seo-reporting-agenturen-monatsreport",
      },
    },
  },
];

export const HUB_COPY = {
  de: {
    title: "SEO-Reporting für Agenturen: Workflows, Vorlagen und Priorisierung",
    metaTitle: "SEO-Reporting für Agenturen: Wissen und Workflows",
    description:
      "Ressourcen für Agenturen, die SEO-Reporting, GSC-, GA4- und Crawl-Signale in klare Monats-Snapshots und priorisierte Maßnahmen übersetzen wollen.",
    intro:
      "Diese Ressourcen sind für Agenturen, die nicht noch mehr Reporting-Flächen brauchen, sondern eine klarere Arbeitslogik vom Signal zur nächsten Maßnahme.",
    audienceTitle: "Für wen diese Ressourcen sind",
    audience:
      "Für kleine SEO- und Digitalagenturen, die mehrere Kunden-Websites betreuen, monatliche Reports vorbereiten und im Kundencall erklären müssen, welche Arbeit als Nächstes sinnvoll ist.",
    groups: [
      {
        title: "Monatsreporting",
        body: "Wie Monatsreports Veränderungen, Ursachen und nächste Schritte beantworten.",
      },
      {
        title: "Priorisierung und Maßnahmenliste",
        body: "Wie Findings aus GSC, GA4 und Crawl in eine begründete Arbeitsreihenfolge kommen.",
      },
      {
        title: "GSC, GA4 und technische Signale",
        body: "Wie Datenquellen zusammenpassen, ohne den Kundencall mit Rohdaten zu überladen.",
      },
    ],
    ctaTitle: "Sehen Sie den Reporting-Workflow in der Demo.",
    ctaBody:
      "Die Demo zeigt mit fiktiven Beispieldaten, wie WebHealth Monats-Snapshots und priorisierte Maßnahmenlisten für Agenturen strukturiert.",
  },
  en: {
    title: "SEO Reporting for Agencies: Workflows, Templates, and Prioritization",
    metaTitle: "SEO Reporting for Agencies: Resources and Workflows",
    description:
      "Resources for agencies that want to turn SEO reporting, GSC, GA4, and crawl signals into monthly snapshots and prioritized actions.",
    intro:
      "These resources are for agencies that do not need more reporting surfaces, but a clearer way to move from signal to next action.",
    audienceTitle: "Who these resources are for",
    audience:
      "For small SEO and digital agencies managing multiple client websites, preparing monthly reports, and explaining which work should happen next in the client call.",
    groups: [
      {
        title: "Monthly reporting",
        body: "How monthly reports answer changes, causes, and next steps.",
      },
      {
        title: "Prioritization and action lists",
        body: "How findings from GSC, GA4, and crawl data become a justified work order.",
      },
      {
        title: "GSC, GA4, and technical signals",
        body: "How data sources fit together without overloading the client call with raw data.",
      },
    ],
    ctaTitle: "See the reporting workflow in the demo.",
    ctaBody:
      "The demo uses fictional sample data to show how WebHealth structures monthly snapshots and prioritized action lists for agencies.",
  },
} as const;

export function getAgencyResourcesPath(language: AgencyLandingLanguage) {
  return language === "de" ? "/de/wissen" : "/en/resources";
}

export function getClusterArticlePath(
  language: AgencyLandingLanguage,
  slug: ClusterArticleSlug,
) {
  return `${getAgencyResourcesPath(language)}/${slug}`;
}

export function getClusterArticle(slug: string) {
  return CLUSTER_ARTICLES.find((article) => article.slug === slug) ?? null;
}

export function getClusterAlternates(
  kind: ClusterPageKind,
  slug?: ClusterArticleSlug,
) {
  const de = kind === "hub" ? getAgencyResourcesPath("de") : getClusterArticlePath("de", slug!);
  const en = kind === "hub" ? getAgencyResourcesPath("en") : getClusterArticlePath("en", slug!);
  return { de, en, "x-default": de };
}

export function buildClusterHubMetadata(language: AgencyLandingLanguage): Metadata {
  const copy = HUB_COPY[language];
  const path = getAgencyResourcesPath(language);

  return {
    title: copy.metaTitle,
    description: copy.description,
    alternates: {
      canonical: path,
      languages: getClusterAlternates("hub"),
    },
    openGraph: {
      url: path,
      title: copy.metaTitle,
      description: copy.description,
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metaTitle,
      description: copy.description,
      images: ["/og-image.png"],
    },
  };
}

export function buildClusterArticleMetadata(
  language: AgencyLandingLanguage,
  article: ClusterArticle,
): Metadata {
  const path = getClusterArticlePath(language, article.slug);

  return {
    title: article.metaTitle[language],
    description: article.description[language],
    alternates: {
      canonical: path,
      languages: getClusterAlternates("article", article.slug),
    },
    openGraph: {
      url: path,
      title: article.metaTitle[language],
      description: article.description[language],
      images: ["/og-image.png"],
      type: "article",
      publishedTime: article.date,
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle[language],
      description: article.description[language],
      images: ["/og-image.png"],
    },
  };
}

export function buildClusterJsonLd({
  language,
  kind,
  article,
}: {
  language: AgencyLandingLanguage;
  kind: ClusterPageKind;
  article?: ClusterArticle;
}) {
  const path =
    kind === "hub"
      ? getAgencyResourcesPath(language)
      : getClusterArticlePath(language, article!.slug);
  const url = `${AGENCY_PRODUCTION_BASE_URL}${path}`;
  const resourcesName = language === "de" ? "Wissen" : "Resources";
  const title = kind === "hub" ? HUB_COPY[language].title : article!.title[language];
  const description =
    kind === "hub" ? HUB_COPY[language].description : article!.description[language];
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement:
        kind === "hub"
          ? [
              {
                "@type": "ListItem",
                position: 1,
                name: language === "de" ? "Startseite" : "Homepage",
                item: `${AGENCY_PRODUCTION_BASE_URL}${getAgencyHomePath(language)}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: resourcesName,
                item: url,
              },
            ]
          : [
              {
                "@type": "ListItem",
                position: 1,
                name: language === "de" ? "Startseite" : "Homepage",
                item: `${AGENCY_PRODUCTION_BASE_URL}${getAgencyHomePath(language)}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: resourcesName,
                item: `${AGENCY_PRODUCTION_BASE_URL}${getAgencyResourcesPath(language)}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: title,
                item: url,
              },
            ],
    },
  ];

  if (kind === "hub") {
    graph.push({
      "@type": "CollectionPage",
      "@id": `${url}#collection`,
      name: title,
      description,
      url,
      inLanguage: language,
      isPartOf: {
        "@id": `${AGENCY_PRODUCTION_BASE_URL}/#website`,
      },
    });
  } else {
    graph.push(
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: title,
        description,
        datePublished: article!.date,
        dateModified: article!.date,
        inLanguage: language,
        author: {
          "@type": "Organization",
          name: "DevBrew",
        },
        publisher: {
          "@id": `${AGENCY_PRODUCTION_BASE_URL}/#organization`,
        },
        mainEntityOfPage: url,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: article!.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question[language],
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer[language],
          },
        })),
      },
    );
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function getCommercialPageBullets(language: AgencyLandingLanguage) {
  return language === "de"
    ? [
        "Für kleine SEO- und Digitalagenturen mit mehreren Kunden-Websites.",
        "Verbindet GSC-, GA4- und Crawl-Signale zu Monats-Snapshots.",
        "Übersetzt Auffälligkeiten in eine priorisierte Maßnahmenliste.",
        "Ersetzt keine SEO-Spezialtools, sondern ergänzt sie als Entscheidungsebene.",
      ]
    : [
        "For small SEO and digital agencies managing multiple client websites.",
        "Connects GSC, GA4, and crawl signals into monthly snapshots.",
        "Turns anomalies into a prioritized action list.",
        "Does not replace specialist SEO tools; it adds a decision layer above them.",
      ];
}

export function getPrimaryClusterCta(language: AgencyLandingLanguage) {
  return {
    href: getAgencyDemoPath(language),
    label: language === "de" ? "Demo ansehen" : "View demo",
  };
}

export function getSecondaryClusterCta(language: AgencyLandingLanguage) {
  return {
    href: getAgencySeoTopicPath(language),
    label:
      language === "de"
        ? "SEO Reporting Software für Agenturen"
        : "SEO reporting software for agencies",
  };
}

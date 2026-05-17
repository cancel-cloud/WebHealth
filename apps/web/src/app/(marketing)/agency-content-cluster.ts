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
  | "seo-massnahmen-priorisieren-backlog-agentur";

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
        href: "https://support.google.com/analytics/answer/13086258",
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

import {
  AGENCY_FAQ_ITEMS,
  AGENCY_HOME_COPY,
  AGENCY_PILOT,
} from "./agency-homepage.content";
import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import {
  AGENCY_PRODUCTION_BASE_URL,
  AGENCY_SEO_TITLES,
  getAgencyAboutPath,
  getAgencyDemoPath,
  getAgencyHomePath,
  getAgencyPricingPath,
  getAgencySeoTopicPath,
} from "./agency-seo.logic";
import {
  CLUSTER_ARTICLES,
  CLUSTER_ARTICLE_SLUGS,
  HUB_COPY,
  getClusterArticle,
  getClusterArticlePath,
} from "./agency-content-cluster";
import { getLegalDocument } from "./legal/legal-content";
import {
  buildLegalHref,
  LEGAL_DOCUMENT_IDS,
  LEGAL_NAV_LABELS,
  type LegalDocumentId,
  type LegalLocale,
} from "./legal/legal-routes";

const HOMEPAGE_SERVICE_DOC_LINK = '</llms.txt>; rel="service-doc"; type="text/markdown"';

const MARKDOWN_DOCUMENT_PATHS = new Set([
  "/en",
  "/de",
  "/pricing",
  "/en/pricing",
  "/de/pricing",
  "/demo",
  "/en/demo",
  "/de/demo",
  "/about",
  "/en/about",
  "/de/about",
  "/en/seo-reporting-software-agencies",
  "/de/seo-reporting-tool-agenturen",
  "/de/wissen",
  "/en/resources",
  ...CLUSTER_ARTICLE_SLUGS.flatMap((slug) => [
    getClusterArticlePath("de", slug),
    getClusterArticlePath("en", slug),
  ]),
  ...LEGAL_DOCUMENT_IDS.flatMap((documentId) => [
    buildLegalHref(documentId, "en"),
    buildLegalHref(documentId, "de"),
  ]),
]);

type AcceptPreference = {
  mediaType: string;
  quality: number;
  index: number;
};

export type MarkdownDocument = {
  markdown: string;
  tokenEstimate: number;
};

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function parseAcceptHeader(accept: string | null): AcceptPreference[] {
  if (!accept) return [];

  return accept
    .split(",")
    .map((entry, index) => {
      const [rawMediaType, ...params] = entry.trim().split(";");
      const mediaType = rawMediaType.trim().toLowerCase();
      const qParam = params
        .map((param) => param.trim().toLowerCase())
        .find((param) => param.startsWith("q="));
      const quality = qParam ? Number(qParam.slice(2)) : 1;

      return {
        mediaType,
        quality: Number.isFinite(quality) ? Math.max(0, Math.min(1, quality)) : 0,
        index,
      };
    })
    .filter((preference) => preference.mediaType.length > 0 && preference.quality > 0);
}

function getQuality(
  preferences: AcceptPreference[],
  mediaType: "text/html" | "text/markdown",
) {
  const exact = preferences.filter((preference) => preference.mediaType === mediaType);
  if (exact.length === 0) return null;

  return exact.sort((left, right) => {
    if (right.quality !== left.quality) return right.quality - left.quality;
    return left.index - right.index;
  })[0]?.quality ?? null;
}

export function isPublicMarkdownPath(pathname: string) {
  return MARKDOWN_DOCUMENT_PATHS.has(normalizePathname(pathname));
}

export function shouldServeMarkdown(accept: string | null, pathname: string) {
  if (!isPublicMarkdownPath(pathname)) return false;

  const preferences = parseAcceptHeader(accept);
  const markdownQuality = getQuality(preferences, "text/markdown");
  if (markdownQuality === null) return false;

  const htmlQuality = getQuality(preferences, "text/html");
  return htmlQuality === null || markdownQuality > htmlQuality;
}

export function getMarkdownRoutePath(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);
  if (!isPublicMarkdownPath(normalizedPathname)) return null;
  return `/agent-markdown?path=${encodeURIComponent(normalizedPathname)}`;
}

export function buildHomepageLinkHeader(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);
  if (
    normalizedPathname !== "/" &&
    normalizedPathname !== "/en" &&
    normalizedPathname !== "/de"
  ) {
    return null;
  }
  return HOMEPAGE_SERVICE_DOC_LINK;
}

export function getRobotsTxt() {
  return [
    "# Content Signals",
    "# Public marketing and documentation content may be used for search and AI grounding.",
    "# WebHealth does not grant permission to use this site for AI model training.",
    "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    "",
    "User-agent: *",
    "Allow: /",
    "Allow: /de",
    "Allow: /en",
    "Allow: /de/seo-reporting-tool-agenturen",
    "Allow: /en/seo-reporting-software-agencies",
    "Allow: /de/wissen",
    "Allow: /en/resources",
    "Allow: /about",
    "Allow: /en/about",
    "Allow: /de/about",
    "Allow: /pricing",
    "Allow: /en/pricing",
    "Allow: /de/pricing",
    "Allow: /en/demo",
    "Allow: /de/demo",
    "Allow: /en/privacy",
    "Allow: /de/privacy",
    "Allow: /en/terms",
    "Allow: /de/terms",
    "Allow: /en/impressum",
    "Allow: /de/impressum",
    "Allow: /en/dpa",
    "Allow: /de/dpa",
    "Disallow: /dashboard",
    "Disallow: /settings",
    "Disallow: /properties",
    "Disallow: /admin",
    "Disallow: /api",
    "",
    `Sitemap: ${AGENCY_PRODUCTION_BASE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

function estimateTokens(markdown: string) {
  return Math.ceil(markdown.trim().split(/\s+/).filter(Boolean).length * 1.33);
}

function withTokenEstimate(markdown: string): MarkdownDocument {
  return {
    markdown: `${markdown.trim()}\n`,
    tokenEstimate: estimateTokens(markdown),
  };
}

function list(items: readonly string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function publicLinks() {
  return [
    `- [English homepage](${AGENCY_PRODUCTION_BASE_URL}/en)`,
    `- [German homepage](${AGENCY_PRODUCTION_BASE_URL}/de)`,
    `- [English pricing](${AGENCY_PRODUCTION_BASE_URL}${getAgencyPricingPath("en")})`,
    `- [German pricing](${AGENCY_PRODUCTION_BASE_URL}${getAgencyPricingPath("de")})`,
    `- [English public demo](${AGENCY_PRODUCTION_BASE_URL}${getAgencyDemoPath("en")})`,
    `- [German public demo](${AGENCY_PRODUCTION_BASE_URL}${getAgencyDemoPath("de")})`,
    `- [About WebHealth](${AGENCY_PRODUCTION_BASE_URL}${getAgencyAboutPath("en")})`,
    `- [Über WebHealth](${AGENCY_PRODUCTION_BASE_URL}${getAgencyAboutPath("de")})`,
    `- [SEO reporting software for agencies](${AGENCY_PRODUCTION_BASE_URL}/en/seo-reporting-software-agencies)`,
    `- [SEO Reporting Tool für Agenturen](${AGENCY_PRODUCTION_BASE_URL}/de/seo-reporting-tool-agenturen)`,
    `- [SEO reporting resources](${AGENCY_PRODUCTION_BASE_URL}/en/resources)`,
    `- [SEO-Reporting Wissen](${AGENCY_PRODUCTION_BASE_URL}/de/wissen)`,
    `- [Privacy Policy](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("privacy", "en")})`,
    `- [Datenschutzhinweise](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("privacy", "de")})`,
    `- [Terms of Service](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("terms", "en")})`,
    `- [Nutzungsbedingungen](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("terms", "de")})`,
    `- [Impressum EN](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("impressum", "en")})`,
    `- [Impressum DE](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("impressum", "de")})`,
    `- [Data Processing Agreement](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("dpa", "en")})`,
    `- [Auftragsverarbeitungsvertrag](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("dpa", "de")})`,
  ].join("\n");
}

export function getLlmsTxt() {
  return withTokenEstimate(`
# WebHealth

WebHealth is SEO reporting software for agencies that turns Search Console, GA4, and crawl signals into monthly snapshots and prioritized action backlogs.

## Intended audience

WebHealth is intended for SEO agencies, web agencies, freelancers, and client-service teams that manage several customer websites and need reviewable next actions from recurring SEO reports.

## What WebHealth does

- Connects Google Search Console and Google Analytics 4 signals with crawl findings.
- Produces agency-facing monthly snapshots and prioritized P1/P2/P3 action backlogs.
- Helps prepare client meetings with evidence-backed SEO recommendations.
- Provides a public demo with fictional sample data.

## What WebHealth does not do

- It does not replace Ahrefs, Semrush, Screaming Frog, Looker Studio, or professional SEO judgment.
- It does not publish customer dashboards, customer data, authenticated product APIs, auth callbacks, or internal app routes as public discovery surfaces.
- It does not currently provide a stable public third-party API catalog.

## Public links

${publicLinks()}

## Non-public surfaces

Dashboard, customer, authentication, settings, admin, property, and API routes are protected product surfaces. They are not intended for agent discovery, retrieval, training, crawling beyond authenticated use, or API cataloging.
`);
}

function homepageMarkdown(language: AgencyLandingLanguage) {
  const copy = AGENCY_HOME_COPY;
  const title = copy.hero.title[language].join("");

  return withTokenEstimate(`
# ${AGENCY_SEO_TITLES[language]}

${title}

${copy.hero.lead[language]}

## Positioning

${copy.competitor.lead[language]}

## Pilot offer

${copy.pricing.title[language]}

${copy.pricing.lead[language]}

${copy.pricing.finePrint[language]}

## Notes

${list(copy.hero.notes[language])}

## FAQ

${AGENCY_FAQ_ITEMS.map((item) => `### ${item.question[language]}\n\n${item.answer[language]}`).join("\n\n")}

## Public links

- [Pricing](${AGENCY_PRODUCTION_BASE_URL}${getAgencyPricingPath(language)})
- [Public demo](${AGENCY_PRODUCTION_BASE_URL}${getAgencyDemoPath(language)})
- [About WebHealth](${AGENCY_PRODUCTION_BASE_URL}${getAgencyAboutPath(language)})
- [Localized SEO page](${AGENCY_PRODUCTION_BASE_URL}${getAgencySeoTopicPath(language)})
`);
}

function pricingMarkdown(language: AgencyLandingLanguage) {
  if (language === "de") {
    return withTokenEstimate(`
# WebHealth Preise

Der empfohlene Agentur-Weg ist der Founding Agency Pilot: erster Monat kostenlos, danach EUR ${AGENCY_PILOT.price}/Monat für passende Agenturen.

## Was im Pilot passiert

WebHealth richtet mit der Agentur 3-10 Kunden-Websites ein und erstellt einen gebrandeten SEO-Monats-Snapshot mit KPI-Veränderungen, Traffic-Drops, auffälligen Seiten, Query-Chancen, Crawl-Hinweisen und den wichtigsten nächsten Maßnahmen für Kundenmeetings.

## Zahlung

Für den kostenlosen Pilot-Monat ist kein Stripe-Eintrag nötig. Wenn der Workflow nach dem ersten Monats-Snapshot nützlich ist, schickt WebHealth den Zahlungslink für den Founder-Preis.

## Öffentliche Links

- [Pilot-Check buchen](${AGENCY_PILOT.bookingUrl})
- [Über WebHealth](${AGENCY_PRODUCTION_BASE_URL}${getAgencyAboutPath("de")})
- [Nutzungsbedingungen](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("terms", "de")})
`);
  }

  return withTokenEstimate(`
# WebHealth pricing

The recommended agency path is the Founding Agency Pilot: first month free, then EUR ${AGENCY_PILOT.price}/month for qualified agencies.

## What happens in the pilot

WebHealth sets up 3-10 client websites with the agency and creates a branded monthly SEO snapshot covering KPI changes, traffic drops, notable pages, query opportunities, crawl findings, and the highest-priority next actions for client meetings.

## Payment

No Stripe entry is required for the free pilot month. If the workflow is useful after the first monthly snapshot, WebHealth sends a payment link for the founder rate.

## Public links

- [Book pilot check](${AGENCY_PILOT.bookingUrl})
- [About WebHealth](${AGENCY_PRODUCTION_BASE_URL}${getAgencyAboutPath("en")})
- [Terms of Service](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("terms", "en")})
`);
}

function demoMarkdown(language: AgencyLandingLanguage) {
  if (language === "de") {
    return withTokenEstimate(`
# WebHealth Demo

Die öffentliche Demo zeigt ein fiktives Acme-Bakery-Dashboard und macht sichtbar, wie WebHealth Search Console, GA4, Crawl-Checks und KI-gestützte Prüfung in priorisierte SEO-Maßnahmen übersetzt.

Backend-Aktionen wie Refreshes, Zuweisungen, Status-Updates und Share-Links sind in der öffentlichen Demo deaktiviert.

## Öffentliche Links

- [Demo öffnen](${AGENCY_PRODUCTION_BASE_URL}${getAgencyDemoPath("de")})
- [Preise](${AGENCY_PRODUCTION_BASE_URL}${getAgencyPricingPath("de")})
- [Über WebHealth](${AGENCY_PRODUCTION_BASE_URL}${getAgencyAboutPath("de")})
`);
  }

  return withTokenEstimate(`
# WebHealth demo

The public demo shows a fictional Acme Bakery dashboard that illustrates how WebHealth turns Search Console, GA4, crawl checks, and AI-assisted review into prioritized SEO optimization work.

Backend actions such as refreshes, assignment, action-state updates, and share-link creation are disabled on the public demo.

## Public links

- [Open the demo](${AGENCY_PRODUCTION_BASE_URL}${getAgencyDemoPath("en")})
- [Pricing](${AGENCY_PRODUCTION_BASE_URL}${getAgencyPricingPath("en")})
- [About WebHealth](${AGENCY_PRODUCTION_BASE_URL}${getAgencyAboutPath("en")})
`);
}

function aboutMarkdown(language: AgencyLandingLanguage) {
  if (language === "de") {
    return withTokenEstimate(`
# Über WebHealth

WebHealth wird von DevBrew gebaut, damit Agenturen SEO-Maßnahmen ausliefern statt Daten zu jagen.

WebHealth verbindet Google Search Console und Google Analytics 4 mit Crawl-Checks und übersetzt die Signale in priorisierte, überprüfbare Fix-Listen für Kunden-Websites.

## Betriebsnotizen

- WebHealth wird von DevBrew betrieben, einem kleinen Studio aus Frankfurt.
- Das Produkt ist für Agenturen und freie Webteams gebaut.
- Empfehlungen sollen deterministisch, überprüfbar und auf GSC-, GA4- oder Crawl-Evidenz zurückführbar sein.
- Google OAuth Tokens werden verschlüsselt gespeichert, und öffentliche Datenschutzdetails stehen in den Datenschutzhinweisen.

## Öffentliche Links

- [Impressum](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("impressum", "de")})
- [Datenschutzhinweise](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("privacy", "de")})
- [Nutzungsbedingungen](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("terms", "de")})
- [Preise](${AGENCY_PRODUCTION_BASE_URL}${getAgencyPricingPath("de")})
`);
  }

  return withTokenEstimate(`
# About WebHealth

WebHealth is built by DevBrew so agencies can ship SEO fixes instead of chasing data.

WebHealth connects Google Search Console and Google Analytics 4 to client workspaces, runs crawl checks, and turns the result into ranked, reviewable fix lists.

## Operating notes

- WebHealth is operated by DevBrew, a small Frankfurt-based studio.
- The product is built for agencies and freelance web teams.
- Recommendations are intended to be deterministic, reviewable, and tied back to underlying GSC, GA4, or crawl evidence.
- Google OAuth tokens are encrypted at rest, and public privacy details are available on the Privacy Policy page.

## Public links

- [Impressum](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("impressum", "en")})
- [Privacy Policy](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("privacy", "en")})
- [Terms of Service](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("terms", "en")})
- [Pricing](${AGENCY_PRODUCTION_BASE_URL}${getAgencyPricingPath("en")})
`);
}

function legalMarkdown(
  documentId: LegalDocumentId,
  locale: LegalLocale,
) {
  const document = getLegalDocument(locale, documentId);
  const links = LEGAL_DOCUMENT_IDS.map(
    (id) =>
      `- [${LEGAL_NAV_LABELS[locale][id]}](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref(id, locale)})`,
  ).join("\n");

  return withTokenEstimate(`
# ${document.title}

${document.description}

${document.intro.join("\n\n")}

${document.sections
  .map((section) => {
    const paragraphs = section.paragraphs?.join("\n\n") ?? "";
    const bullets = section.bullets?.length ? `\n\n${list(section.bullets)}` : "";
    return `## ${section.title}\n\n${paragraphs}${bullets}`;
  })
  .join("\n\n")}

## Related legal pages

${links}
`);
}

function topicMarkdown(language: AgencyLandingLanguage) {
  const title =
    language === "de"
      ? "SEO Reporting Tool für Agenturen: Monatsreports, die zu Maßnahmen werden."
      : "SEO reporting software for agencies that turns monthly reports into action.";
  const lead =
    language === "de"
      ? "WebHealth hilft Agenturen, GSC-, GA4- und Crawl-Daten nicht nur zu sammeln, sondern in Monats-Snapshots und priorisierte Maßnahmenlisten für Kundenmeetings zu übersetzen."
      : "WebHealth helps agencies turn GSC, GA4, and crawl data into a prioritized action plan for client meetings, not just another reporting archive.";
  const boundary =
    language === "de"
      ? "WebHealth ersetzt keine professionelle SEO-Recherche, kein Keyword-Tool und keinen tiefen technischen Crawl. Es sitzt über diesen Signalen und macht aus wiederkehrendem Reporting eine Entscheidungsschicht für Agenturen."
      : "WebHealth does not replace professional SEO research, keyword tooling, or deep technical crawling. It sits above those signals and turns recurring reporting into a decision layer for agencies.";

  return withTokenEstimate(`
# ${title}

${lead}

## What WebHealth delivers

- Monthly SEO snapshots from GSC, GA4, and crawl signals.
- Internal prioritized action lists for agency teams.
- Client meeting preparation with clear next steps.

## Boundary

${boundary}

## Public links

- [Homepage](${AGENCY_PRODUCTION_BASE_URL}${getAgencyHomePath(language)})
- [Public demo](${AGENCY_PRODUCTION_BASE_URL}${getAgencyDemoPath(language)})
- [Pricing](${AGENCY_PRODUCTION_BASE_URL}${getAgencyPricingPath(language)})
`);
}

function resourcesMarkdown(language: AgencyLandingLanguage) {
  const copy = HUB_COPY[language];

  return withTokenEstimate(`
# ${copy.title}

${copy.intro}

## Audience

${copy.audience}

## Published resources

${CLUSTER_ARTICLES.map(
  (article) =>
    `- [${article.title[language]}](${AGENCY_PRODUCTION_BASE_URL}${getClusterArticlePath(language, article.slug)})`,
).join("\n")}

## Conversion path

- [SEO reporting software for agencies](${AGENCY_PRODUCTION_BASE_URL}${getAgencySeoTopicPath(language)})
- [Public demo](${AGENCY_PRODUCTION_BASE_URL}${getAgencyDemoPath(language)})
`);
}

function articleMarkdown(language: AgencyLandingLanguage, slug: string) {
  const article = getClusterArticle(slug);
  if (!article) return null;

  return withTokenEstimate(`
# ${article.title[language]}

${article.intro[language]}

${article.sections
  .map(
    (section) => `## ${section.title[language]}

${section.body[language].join("\n\n")}`,
  )
  .join("\n\n")}

${article.comparison ? `## ${article.comparison.title[language]}

${article.comparison.intro[language]}

${article.comparison.items
  .map(
    (item) => `### ${item.title[language]}

${item.question[language]}

${list(item.signals[language])}`,
  )
  .join("\n\n")}` : ""}

${article.checklist ? `## ${article.checklist.title[language]}

${article.checklist.intro[language]}

${article.checklist.stages
  .map(
    (stage) => `### ${stage.title[language]}

${stage.description[language]}

${list(stage.items[language])}`,
  )
  .join("\n\n")}` : ""}

## Practical workflow

${list(article.workflow[language])}

## Common mistakes

${list(article.mistakes[language])}

## WebHealth

${article.webhealth[language]}

## Sources

${article.sources.map((source) => `- [${source.label}](${source.href})`).join("\n")}
`);
}

export function getMarkdownDocument(pathname: string): MarkdownDocument | null {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/en") return homepageMarkdown("en");
  if (normalizedPathname === "/de") return homepageMarkdown("de");
  if (normalizedPathname === "/pricing") return pricingMarkdown("de");
  if (normalizedPathname === "/en/pricing") return pricingMarkdown("en");
  if (normalizedPathname === "/de/pricing") return pricingMarkdown("de");
  if (normalizedPathname === "/demo") return demoMarkdown("en");
  if (normalizedPathname === "/en/demo") return demoMarkdown("en");
  if (normalizedPathname === "/de/demo") return demoMarkdown("de");
  if (normalizedPathname === "/about") return aboutMarkdown("en");
  if (normalizedPathname === "/en/about") return aboutMarkdown("en");
  if (normalizedPathname === "/de/about") return aboutMarkdown("de");
  if (normalizedPathname === "/en/seo-reporting-software-agencies") return topicMarkdown("en");
  if (normalizedPathname === "/de/seo-reporting-tool-agenturen") return topicMarkdown("de");
  if (normalizedPathname === "/en/resources") return resourcesMarkdown("en");
  if (normalizedPathname === "/de/wissen") return resourcesMarkdown("de");
  for (const slug of CLUSTER_ARTICLE_SLUGS) {
    if (normalizedPathname === getClusterArticlePath("en", slug)) {
      return articleMarkdown("en", slug);
    }
    if (normalizedPathname === getClusterArticlePath("de", slug)) {
      return articleMarkdown("de", slug);
    }
  }
  for (const documentId of LEGAL_DOCUMENT_IDS) {
    if (normalizedPathname === buildLegalHref(documentId, "en")) {
      return legalMarkdown(documentId, "en");
    }
    if (normalizedPathname === buildLegalHref(documentId, "de")) {
      return legalMarkdown(documentId, "de");
    }
  }

  return null;
}

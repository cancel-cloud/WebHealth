import {
  AGENCY_FAQ_ITEMS,
  AGENCY_HOME_COPY,
  AGENCY_PILOT,
} from "./agency-homepage.content";
import type { AgencyLandingLanguage } from "./agency-homepage.logic";
import {
  AGENCY_PRODUCTION_BASE_URL,
  AGENCY_SEO_TITLES,
  getAgencyHomePath,
  getAgencySeoTopicPath,
} from "./agency-seo.logic";
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
  "/demo",
  "/about",
  "/en/seo-reporting-software-agencies",
  "/de/seo-reporting-tool-agenturen",
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
    "Allow: /about",
    "Allow: /pricing",
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
    `- [Pricing](${AGENCY_PRODUCTION_BASE_URL}/pricing)`,
    `- [Public demo](${AGENCY_PRODUCTION_BASE_URL}/demo)`,
    `- [About WebHealth](${AGENCY_PRODUCTION_BASE_URL}/about)`,
    `- [SEO reporting software for agencies](${AGENCY_PRODUCTION_BASE_URL}/en/seo-reporting-software-agencies)`,
    `- [SEO Reporting Tool für Agenturen](${AGENCY_PRODUCTION_BASE_URL}/de/seo-reporting-tool-agenturen)`,
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

- [Pricing](${AGENCY_PRODUCTION_BASE_URL}/pricing)
- [Public demo](${AGENCY_PRODUCTION_BASE_URL}/demo)
- [About WebHealth](${AGENCY_PRODUCTION_BASE_URL}/about)
- [Localized SEO page](${AGENCY_PRODUCTION_BASE_URL}${getAgencySeoTopicPath(language)})
`);
}

function pricingMarkdown() {
  return withTokenEstimate(`
# WebHealth pricing

The recommended agency path is the Founding Agency Pilot: first month free, then EUR ${AGENCY_PILOT.price}/month for qualified agencies.

## What happens in the pilot

WebHealth sets up 3-10 client websites with the agency and creates a branded monthly SEO snapshot covering KPI changes, traffic drops, notable pages, query opportunities, crawl findings, and the highest-priority next actions for client meetings.

## Payment

No Stripe entry is required for the free pilot month. If the workflow is useful after the first monthly snapshot, WebHealth sends a payment link for the founder rate.

## Public links

- [Book pilot check](${AGENCY_PILOT.bookingUrl})
- [About WebHealth](${AGENCY_PRODUCTION_BASE_URL}/about)
- [Terms of Service](${AGENCY_PRODUCTION_BASE_URL}${buildLegalHref("terms", "en")})
`);
}

function demoMarkdown() {
  return withTokenEstimate(`
# WebHealth demo

The public demo shows a fictional Acme Bakery dashboard that illustrates how WebHealth turns Search Console, GA4, crawl checks, and AI-assisted review into prioritized SEO optimization work.

Backend actions such as refreshes, assignment, action-state updates, and share-link creation are disabled on the public demo.

## Public links

- [Open the demo](${AGENCY_PRODUCTION_BASE_URL}/demo)
- [Pricing](${AGENCY_PRODUCTION_BASE_URL}/pricing)
- [About WebHealth](${AGENCY_PRODUCTION_BASE_URL}/about)
`);
}

function aboutMarkdown() {
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
- [Pricing](${AGENCY_PRODUCTION_BASE_URL}/pricing)
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
      ? "WebHealth hilft Agenturen, GSC-, GA4- und Crawl-Daten nicht nur zu sammeln, sondern in einen priorisierten Maßnahmenplan für Kundenmeetings zu übersetzen."
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
- Internal prioritized action backlogs for agency teams.
- Client meeting preparation with clear next steps.

## Boundary

${boundary}

## Public links

- [Homepage](${AGENCY_PRODUCTION_BASE_URL}${getAgencyHomePath(language)})
- [Public demo](${AGENCY_PRODUCTION_BASE_URL}/demo)
- [Pricing](${AGENCY_PRODUCTION_BASE_URL}/pricing)
`);
}

export function getMarkdownDocument(pathname: string): MarkdownDocument | null {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === "/en") return homepageMarkdown("en");
  if (normalizedPathname === "/de") return homepageMarkdown("de");
  if (normalizedPathname === "/pricing") return pricingMarkdown();
  if (normalizedPathname === "/demo") return demoMarkdown();
  if (normalizedPathname === "/about") return aboutMarkdown();
  if (normalizedPathname === "/en/seo-reporting-software-agencies") return topicMarkdown("en");
  if (normalizedPathname === "/de/seo-reporting-tool-agenturen") return topicMarkdown("de");
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

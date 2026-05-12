import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENCY_PRODUCTION_BASE_URL,
  buildAgencyHomeMetadata,
  buildAgencyJsonLd,
  buildMarketingSiteJsonLd,
  buildAgencySeoTopicMetadata,
  getAgencyRootRedirectPath,
  getAgencySeoTopicPath,
  resolvePreferredAgencyLanguage,
  serializeJsonLd,
} from "./agency-seo.logic";

test("preferred agency language defaults to German when the browser does not clearly prefer English", () => {
  assert.equal(resolvePreferredAgencyLanguage(null), "de");
  assert.equal(resolvePreferredAgencyLanguage("de-DE,de;q=0.9,en;q=0.8"), "de");
  assert.equal(resolvePreferredAgencyLanguage("fr-FR,fr;q=0.9,en;q=0.8,de;q=0.8"), "de");
  assert.equal(resolvePreferredAgencyLanguage("en-US;q=0.4,en;q=0.7,de;q=0.8"), "de");
});

test("preferred agency language switches to English only when English outranks German", () => {
  assert.equal(resolvePreferredAgencyLanguage("en-US,en;q=0.9,de;q=0.4"), "en");
  assert.equal(resolvePreferredAgencyLanguage("fr-FR,fr;q=0.9,en;q=0.8"), "en");
  assert.equal(resolvePreferredAgencyLanguage("en-US;q=0.4,en;q=0.9,de;q=0.8"), "en");
});

test("root redirect targets the canonical localized homepage path", () => {
  assert.equal(getAgencyRootRedirectPath(null), "/de");
  assert.equal(getAgencyRootRedirectPath("en-GB,en;q=0.9,de;q=0.3"), "/en");
});

test("agency metadata uses localized canonical URLs and hreflang alternates", () => {
  const metadata = buildAgencyHomeMetadata("de");

  assert.equal(metadata.title, "SEO Reporting Tool für Agenturen | WebHealth Pilot");
  assert.equal(metadata.alternates?.canonical, "/de");
  assert.deepEqual(metadata.alternates?.languages, {
    de: "/de",
    en: "/en",
    "x-default": "/de",
  });
});

test("agency SEO topic metadata uses the localized topic slug", () => {
  const metadata = buildAgencySeoTopicMetadata("en");

  assert.equal(getAgencySeoTopicPath("de"), "/de/seo-reporting-tool-agenturen");
  assert.equal(getAgencySeoTopicPath("en"), "/en/seo-reporting-software-agencies");
  assert.equal(metadata.alternates?.canonical, "/en/seo-reporting-software-agencies");
  assert.match(String(metadata.title), /SEO Reporting Software for Agencies/);
  assert.ok(String(metadata.title).length <= 58);
});

test("agency JSON-LD exposes organization, service, software, FAQ, and topic breadcrumbs", () => {
  const jsonLd = buildAgencyJsonLd("de", "home");
  const graph = jsonLd["@graph"];

  assert.equal(jsonLd["@context"], "https://schema.org");
  assert.equal(graph.some((item) => item["@type"] === "Organization"), true);
  assert.equal(graph.some((item) => item["@type"] === "Service"), true);
  assert.equal(graph.some((item) => item["@type"] === "SoftwareApplication"), true);
  assert.equal(graph.some((item) => item["@type"] === "FAQPage"), true);
  assert.equal(graph.find((item) => item["@type"] === "Service")?.url, `${AGENCY_PRODUCTION_BASE_URL}/de`);

  const topicJsonLd = buildAgencyJsonLd("de", "topic");
  const topicGraph = topicJsonLd["@graph"];
  const breadcrumb = topicGraph.find((item) => item["@type"] === "BreadcrumbList");
  assert.ok(breadcrumb);
  assert.match(JSON.stringify(breadcrumb), /seo-reporting-tool-agenturen/);
});

test("pricing JSON-LD covers all public plans", async () => {
  const seoModule = await import("./agency-seo.logic");
  const buildPricingJsonLd = (seoModule as {
    buildPricingJsonLd?: () => { "@graph": Array<{ "@type": string; offers?: unknown }> };
  }).buildPricingJsonLd;

  assert.equal(typeof buildPricingJsonLd, "function");
  const jsonLd = buildPricingJsonLd?.();
  const serialized = JSON.stringify(jsonLd);

  assert.match(serialized, /AggregateOffer|Offer/);
  assert.match(serialized, /Solo/);
  assert.match(serialized, /Starter/);
  assert.match(serialized, /Studio/);
  assert.match(serialized, /Agency/);
  assert.match(serialized, /"0"/);
  assert.match(serialized, /"29"/);
  assert.match(serialized, /"79"/);
  assert.match(serialized, /"149"/);
});

test("marketing site JSON-LD exposes baseline schema for shared marketing pages", () => {
  const jsonLd = buildMarketingSiteJsonLd();
  const graph = jsonLd["@graph"];

  assert.equal(jsonLd["@context"], "https://schema.org");
  assert.equal(graph.some((item) => item["@type"] === "Organization"), true);
  assert.equal(graph.some((item) => item["@type"] === "WebSite"), true);
  assert.equal(graph.some((item) => item["@type"] === "SoftwareApplication"), true);
  assert.equal(
    graph.find((item) => item["@type"] === "WebSite")?.url,
    AGENCY_PRODUCTION_BASE_URL,
  );
});

test("JSON-LD serialization escapes unsafe script delimiters", () => {
  assert.equal(
    serializeJsonLd({ text: "</script><script>alert(1)</script>" }),
    '{"text":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}',
  );
});

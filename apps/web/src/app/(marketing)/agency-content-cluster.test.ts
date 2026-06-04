import assert from "node:assert/strict";
import test from "node:test";
import {
  CLUSTER_ARTICLE_SLUGS,
  CLUSTER_ARTICLES,
  buildClusterArticleMetadata,
  buildClusterHubMetadata,
  buildClusterJsonLd,
  getAgencyResourcesPath,
  getClusterArticlePath,
} from "./agency-content-cluster";

test("cluster routes use localized canonical resource paths", () => {
  assert.equal(getAgencyResourcesPath("de"), "/de/wissen");
  assert.equal(getAgencyResourcesPath("en"), "/en/resources");
  assert.equal(
    getClusterArticlePath("de", "seo-reporting-agenturen-monatsreport"),
    "/de/wissen/seo-reporting-agenturen-monatsreport",
  );
  assert.equal(
    getClusterArticlePath("en", "seo-reporting-agenturen-monatsreport"),
    "/en/resources/seo-reporting-agenturen-monatsreport",
  );
});

test("cluster publishes the localized GSC and GA4 Monatscall article", () => {
  assert.ok(CLUSTER_ARTICLE_SLUGS.includes("gsc-ga4-agentur-reporting-monatscall"));
  assert.equal(
    getClusterArticlePath("de", "gsc-ga4-agentur-reporting-monatscall"),
    "/de/wissen/gsc-ga4-agentur-reporting-monatscall",
  );
  assert.equal(
    getClusterArticlePath("en", "gsc-ga4-agentur-reporting-monatscall"),
    "/en/resources/gsc-ga4-agentur-reporting-monatscall",
  );

  const article = CLUSTER_ARTICLES.find(
    (item) => item.slug === "gsc-ga4-agentur-reporting-monatscall",
  );
  assert.ok(article);
  assert.equal(article.date, "2026-06-04");
  assert.match(article.title.de, /Welche Daten wirklich in den Monatscall gehören/);
  assert.ok(article.comparison);
  assert.equal(article.comparison.items.length, 2);
  assert.ok(article.checklist);
  assert.equal(article.checklist.stages.length, 3);
});

test("cluster metadata exposes canonical and hreflang alternates", () => {
  const hubMetadata = buildClusterHubMetadata("de");
  assert.equal(hubMetadata.alternates?.canonical, "/de/wissen");
  assert.deepEqual(hubMetadata.alternates?.languages, {
    de: "/de/wissen",
    en: "/en/resources",
    "x-default": "/de/wissen",
  });

  const article = CLUSTER_ARTICLES[0]!;
  const articleMetadata = buildClusterArticleMetadata("en", article);
  assert.equal(
    articleMetadata.alternates?.canonical,
    "/en/resources/seo-reporting-agenturen-monatsreport",
  );
  assert.match(String(articleMetadata.title), /SEO Reporting for Agencies/);
});

test("cluster JSON-LD includes breadcrumbs, article, and FAQ schema", () => {
  const hubJsonLd = buildClusterJsonLd({ language: "de", kind: "hub" });
  const hubGraph = hubJsonLd["@graph"];
  assert.equal(hubGraph.some((item) => item["@type"] === "BreadcrumbList"), true);
  assert.equal(hubGraph.some((item) => item["@type"] === "CollectionPage"), true);

  const articleJsonLd = buildClusterJsonLd({
    language: "de",
    kind: "article",
    article: CLUSTER_ARTICLES[0],
  });
  const articleGraph = articleJsonLd["@graph"];
  assert.equal(articleGraph.some((item) => item["@type"] === "Article"), true);
  assert.equal(articleGraph.some((item) => item["@type"] === "FAQPage"), true);
  assert.match(JSON.stringify(articleGraph), /seo-reporting-agenturen-monatsreport/);
});

test("German cluster copy uses formal public terminology", () => {
  const serialized = JSON.stringify(CLUSTER_ARTICLES);
  assert.match(serialized, /priorisierte Maßnahmenliste|Maßnahmenliste/);
  assert.doesNotMatch(serialized, /Action Backlog/);
});

test("GSC and GA4 article teaches Key Events without claiming distinct WebHealth support", () => {
  const article = CLUSTER_ARTICLES.find(
    (item) => item.slug === "gsc-ga4-agentur-reporting-monatscall",
  );
  assert.ok(article);

  const educationalCopy = JSON.stringify({
    sections: article.sections,
    workflow: article.workflow,
    faqs: article.faqs,
    checklist: article.checklist,
  });
  assert.match(educationalCopy, /Key Events/);
  assert.match(article.webhealth.de, /Events/);
  assert.doesNotMatch(article.webhealth.de, /Key Events/);
  assert.doesNotMatch(article.webhealth.en, /Key Events/);
  assert.ok(
    article.sources.some(
      (source) => source.href === "https://support.google.com/analytics/answer/10737381",
    ),
  );
  assert.ok(article.sections.some((section) => section.body.de.some((body) => /klar begründete Maßnahme/.test(body))));
  assert.doesNotMatch(JSON.stringify(article), /answer\/13086258|reviewbare Maßnahme/);
});

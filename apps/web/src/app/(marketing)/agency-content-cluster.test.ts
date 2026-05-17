import assert from "node:assert/strict";
import test from "node:test";
import {
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

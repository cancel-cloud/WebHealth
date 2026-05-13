import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHomepageLinkHeader,
  getMarkdownDocument,
  getMarkdownRoutePath,
  getLlmsTxt,
  getRobotsTxt,
  shouldServeMarkdown,
} from "./agent-discovery.logic";

test("markdown is served when text/markdown is preferred and html is absent", () => {
  assert.equal(shouldServeMarkdown("text/markdown", "/en"), true);
});

test("markdown is served when text/markdown has a higher q value than html", () => {
  assert.equal(
    shouldServeMarkdown("text/markdown;q=1, text/html;q=0.5", "/en"),
    true,
  );
});

test("html wins when text/html has a higher q value than markdown", () => {
  assert.equal(
    shouldServeMarkdown("text/html;q=1, text/markdown;q=0.5", "/en"),
    false,
  );
});

test("browser-style accept headers keep html", () => {
  assert.equal(
    shouldServeMarkdown(
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "/en",
    ),
    false,
  );
});

test("wildcards alone do not opt clients into markdown", () => {
  assert.equal(shouldServeMarkdown("*/*", "/en"), false);
  assert.equal(shouldServeMarkdown("text/*", "/en"), false);
});

test("explicit markdown wins when html is only accepted by wildcard", () => {
  assert.equal(shouldServeMarkdown("text/markdown, */*", "/en"), true);
});

test("markdown negotiation is limited to public marketing routes", () => {
  assert.equal(shouldServeMarkdown("text/markdown", "/pricing"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/en/pricing"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/de/pricing"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/en/demo"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/de/demo"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/en/about"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/de/about"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/de/privacy"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/de/terms"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/de/impressum"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/de/dpa"), true);
  assert.equal(shouldServeMarkdown("text/markdown", "/api/properties"), false);
  assert.equal(shouldServeMarkdown("text/markdown", "/dashboard"), false);
  assert.equal(shouldServeMarkdown("text/markdown", "/admin"), false);
  assert.equal(shouldServeMarkdown("text/markdown", "/properties/abc"), false);
  assert.equal(shouldServeMarkdown("text/markdown", "/settings"), false);
});

test("markdown route path is only generated for public markdown documents", () => {
  assert.equal(getMarkdownRoutePath("/en"), "/agent-markdown?path=%2Fen");
  assert.equal(getMarkdownRoutePath("/api/properties"), null);
});

test("homepage link header includes only existing public service docs", () => {
  assert.equal(
    buildHomepageLinkHeader("/"),
    '</llms.txt>; rel="service-doc"; type="text/markdown"',
  );
  assert.equal(
    buildHomepageLinkHeader("/en"),
    '</llms.txt>; rel="service-doc"; type="text/markdown"',
  );
  assert.equal(
    buildHomepageLinkHeader("/de"),
    '</llms.txt>; rel="service-doc"; type="text/markdown"',
  );
  assert.equal(buildHomepageLinkHeader("/pricing"), null);
  assert.doesNotMatch(buildHomepageLinkHeader("/en") ?? "", /api-catalog|docs|status/);
});

test("robots txt includes content signals and preserves crawler boundaries", () => {
  const robots = getRobotsTxt();

  assert.match(robots, /Content Signals/);
  assert.match(robots, /Content-Signal: search=yes, ai-input=yes, ai-train=no/);
  assert.match(robots, /Sitemap: https:\/\/webhealth\.devbrew\.dev\/sitemap\.xml/);
  assert.match(robots, /Disallow: \/api/);
  assert.match(robots, /Allow: \/en/);
  assert.match(robots, /Allow: \/en\/pricing/);
  assert.match(robots, /Allow: \/de\/pricing/);
  assert.match(robots, /Allow: \/en\/demo/);
  assert.match(robots, /Allow: \/de\/demo/);
  assert.match(robots, /Allow: \/en\/about/);
  assert.match(robots, /Allow: \/de\/about/);
  assert.match(robots, /Allow: \/de\/privacy/);
  assert.match(robots, /Allow: \/de\/terms/);
  assert.match(robots, /Allow: \/de\/impressum/);
  assert.match(robots, /Allow: \/de\/dpa/);
});

test("markdown documents expose public marketing content without private routes", () => {
  const document = getMarkdownDocument("/en");

  assert.ok(document);
  assert.match(document?.markdown ?? "", /SEO reporting software for agencies/i);
  assert.doesNotMatch(document?.markdown ?? "", /\/api\/|\/dashboard|\/admin|\/properties|\/settings/);
});

test("localized legal markdown documents are available", () => {
  const document = getMarkdownDocument("/de/privacy");

  assert.ok(document);
  assert.match(document?.markdown ?? "", /Datenschutzhinweise/);
  assert.doesNotMatch(document?.markdown ?? "", /\/privacy\?lang=de/);
});

test("localized pricing markdown documents are available", () => {
  const englishDocument = getMarkdownDocument("/en/pricing");
  const germanDocument = getMarkdownDocument("/de/pricing");

  assert.ok(englishDocument);
  assert.ok(germanDocument);
  assert.match(englishDocument?.markdown ?? "", /WebHealth pricing/);
  assert.match(germanDocument?.markdown ?? "", /WebHealth Preise/);
});

test("localized demo markdown documents are available", () => {
  const englishDocument = getMarkdownDocument("/en/demo");
  const germanDocument = getMarkdownDocument("/de/demo");

  assert.ok(englishDocument);
  assert.ok(germanDocument);
  assert.match(englishDocument?.markdown ?? "", /WebHealth demo/);
  assert.match(germanDocument?.markdown ?? "", /öffentliche Demo/);
  assert.doesNotMatch(germanDocument?.markdown ?? "", /\/dashboard|\/api|\/properties/);
});

test("localized about markdown documents are available", () => {
  const englishDocument = getMarkdownDocument("/en/about");
  const germanDocument = getMarkdownDocument("/de/about");

  assert.ok(englishDocument);
  assert.ok(germanDocument);
  assert.match(englishDocument?.markdown ?? "", /About WebHealth/);
  assert.match(germanDocument?.markdown ?? "", /Über WebHealth/);
  assert.doesNotMatch(germanDocument?.markdown ?? "", /\/dashboard|\/api|\/properties/);
});

test("llms txt explains public scope without exposing private discovery routes", () => {
  const document = getLlmsTxt();

  assert.match(document.markdown, /SEO reporting software for agencies/i);
  assert.match(document.markdown, /Intended audience/);
  assert.match(document.markdown, /What WebHealth does/);
  assert.match(document.markdown, /What WebHealth does not do/);
  assert.match(document.markdown, /Dashboard, customer, authentication, settings, admin, property, and API routes are protected product surfaces/);
  assert.doesNotMatch(document.markdown, /\/api\/|\/dashboard|\/admin|\/properties|\/settings/);
});

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
});

test("markdown documents expose public marketing content without private routes", () => {
  const document = getMarkdownDocument("/en");

  assert.ok(document);
  assert.match(document?.markdown ?? "", /SEO reporting software for agencies/i);
  assert.doesNotMatch(document?.markdown ?? "", /\/api\/|\/dashboard|\/admin|\/properties|\/settings/);
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

import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "./sitemap";

test("sitemap includes the public demo page", () => {
  const urls = sitemap().map((entry) => entry.url);

  assert.ok(urls.includes("https://webhealth.devbrew.dev/de/demo"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/en/demo"));
});

test("sitemap includes localized about pages without legacy about", () => {
  const urls = sitemap().map((entry) => entry.url);

  assert.ok(urls.includes("https://webhealth.devbrew.dev/de/about"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/en/about"));
  assert.equal(urls.includes("https://webhealth.devbrew.dev/about"), false);
});

test("sitemap includes localized legal pages and no legacy legal URLs", () => {
  const urls = sitemap().map((entry) => entry.url);

  assert.ok(urls.includes("https://webhealth.devbrew.dev/en/privacy"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/de/privacy"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/en/terms"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/de/terms"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/en/impressum"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/de/impressum"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/en/dpa"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/de/dpa"));
  assert.equal(urls.some((url) => url.includes("?lang=de")), false);
  assert.equal(urls.includes("https://webhealth.devbrew.dev/privacy"), false);
});

test("sitemap includes the localized agency SEO cluster", () => {
  const urls = sitemap().map((entry) => entry.url);

  assert.ok(urls.includes("https://webhealth.devbrew.dev/de/wissen"));
  assert.ok(urls.includes("https://webhealth.devbrew.dev/en/resources"));
  assert.ok(
    urls.includes(
      "https://webhealth.devbrew.dev/de/wissen/seo-reporting-agenturen-monatsreport",
    ),
  );
  assert.ok(
    urls.includes(
      "https://webhealth.devbrew.dev/en/resources/seo-reporting-agenturen-monatsreport",
    ),
  );
  assert.ok(
    urls.includes(
      "https://webhealth.devbrew.dev/de/wissen/seo-massnahmen-priorisieren-backlog-agentur",
    ),
  );
  assert.ok(
    urls.includes(
      "https://webhealth.devbrew.dev/en/resources/seo-massnahmen-priorisieren-backlog-agentur",
    ),
  );
  assert.ok(
    urls.includes(
      "https://webhealth.devbrew.dev/de/wissen/gsc-ga4-agentur-reporting-monatscall",
    ),
  );
  assert.ok(
    urls.includes(
      "https://webhealth.devbrew.dev/en/resources/gsc-ga4-agentur-reporting-monatscall",
    ),
  );
});

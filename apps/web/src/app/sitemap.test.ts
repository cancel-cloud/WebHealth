import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "./sitemap";

test("sitemap includes the public demo page", () => {
  const urls = sitemap().map((entry) => entry.url);

  assert.ok(urls.includes("https://webhealth.devbrew.dev/demo"));
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

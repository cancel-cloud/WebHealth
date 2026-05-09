import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "./sitemap";

test("sitemap includes the public demo page", () => {
  const urls = sitemap().map((entry) => entry.url);

  assert.ok(urls.includes("https://webhealth.devbrew.dev/demo"));
});

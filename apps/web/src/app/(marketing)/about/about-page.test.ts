import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("about page has localized German and English routes", () => {
  const contentSource = readFileSync(new URL("./about-page-content.tsx", import.meta.url), "utf8");
  const legacyRouteSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  const localizedRouteSource = readFileSync(
    new URL("../[language]/about/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(contentSource, /Über WebHealth/);
  assert.match(contentSource, /About WebHealth/);
  assert.match(contentSource, /languageSwitcherPage="about"/);
  assert.match(legacyRouteSource, /buildAgencyAboutMetadata\("en"\)/);
  assert.match(localizedRouteSource, /buildAgencyAboutMetadata\(language\)/);
  assert.match(localizedRouteSource, /<AboutPageContent language=\{language\} \/>/);
});

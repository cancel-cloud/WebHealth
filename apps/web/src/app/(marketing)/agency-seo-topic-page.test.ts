import assert from "node:assert/strict";
import { accessSync, readFileSync } from "node:fs";
import test from "node:test";

test("agency SEO topic page renders product proof, interactive demo, and visible FAQ", () => {
  const source = readFileSync(
    new URL("./agency-seo-topic-page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /agency-workspace-screenshot\.png/);
  assert.match(source, /AgencyWorkspaceDemo/);
  assert.match(source, /AGENCY_FAQ_ITEMS/);
  assert.match(source, /AGENCY_TOPIC_FAQ_ITEMS/);
  assert.match(source, /monatlicher SEO-Report/);
  assert.match(source, /monthly SEO report/);
  assert.match(source, /AgencyComparisonSection/);
  assert.match(source, /Fiktive Beispieldaten, keine Kundenergebnisse/);
  assert.match(source, /Fictional sample data, not customer results/);
  assert.match(source, /Priorisierte Maßnahmenliste/);
  assert.match(source, /Kein Ersatz für Ahrefs, Semrush oder Screaming Frog/);
  assert.match(source, /Not an Ahrefs, Semrush, or Screaming Frog replacement/);
});

test("agency workspace screenshot asset exists for topic page hero", () => {
  accessSync(new URL("../../../public/agency-workspace-screenshot.png", import.meta.url));
});

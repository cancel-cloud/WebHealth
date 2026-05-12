import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("demo page has localized German route copy and metadata", () => {
  const source = readFileSync(new URL("./demo-page.tsx", import.meta.url), "utf8");
  const localizedRouteSource = readFileSync(
    new URL("../[language]/demo/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(localizedRouteSource, /buildDemoMetadata\(language\)/);
  assert.match(source, /Demo-Dashboard/);
  assert.match(source, /Website-Dashboard/);
  assert.match(source, /Die Steuerelemente unten nutzen/);
  assert.match(source, /canonical: path/);
  assert.match(source, /languages:/);
  assert.doesNotMatch(source, /AgencyHeader language=\\"en\\"/);
});

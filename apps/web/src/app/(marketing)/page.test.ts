import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("landing page skip link only becomes visible on keyboard-style focus", () => {
  const source = readFileSync(
    new URL("./agency-homepage-client.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Skip to main content/);
  assert.match(source, /focus-visible:not-sr-only/);
  assert.doesNotMatch(source, /focus:not-sr-only/);
});

test("agency landing source uses same-page anchors and no longer links homepage CTAs to demo or pricing routes", () => {
  const source = readFileSync(
    new URL("./agency-homepage-client.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /href="#workspace"/);
  assert.match(source, /href="#pricing"/);
  assert.match(source, /id="workspace"/);
  assert.match(source, /id="whitelabel"/);
  assert.match(source, /id="integrations"/);
  assert.match(source, /id="pricing"/);
  assert.match(source, /id="faq"/);
  assert.doesNotMatch(source, /href="\/demo"/);
  assert.doesNotMatch(source, /href="\/pricing"/);
});

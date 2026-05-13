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

test("agency landing source uses same-page anchors and a visible demo CTA", () => {
  const homepageSource = readFileSync(
    new URL("./agency-homepage-client.tsx", import.meta.url),
    "utf8",
  );
  const headerSource = readFileSync(
    new URL("./agency-header.tsx", import.meta.url),
    "utf8",
  );

  assert.match(homepageSource, /samePageAnchors/);
  assert.match(homepageSource, /id="workspace"/);
  assert.match(homepageSource, /id="whitelabel"/);
  assert.match(homepageSource, /id="integrations"/);
  assert.match(homepageSource, /id="pricing"/);
  assert.match(homepageSource, /id="faq"/);
  assert.match(homepageSource, /getAgencyDemoPath\(language\)/);
  assert.match(homepageSource, /id="demo"/);
  assert.match(homepageSource, /getAgencySeoTopicPath/);
  assert.match(homepageSource, /SEO Reporting Tool für Agenturen/);
  assert.match(homepageSource, /SEO reporting software for agencies/);
  assert.match(headerSource, /samePageAnchors \? `#\$\{id\}`/);
  assert.match(headerSource, /getAgencyDemoPath\(language\)/);
  assert.match(headerSource, /getAgencyAboutPath\(language\)/);
  assert.match(headerSource, /id: "faq", key: "faq" \},\n  \{ id: "about", key: "about" \}/);
  assert.doesNotMatch(headerSource, /key: "workspace"/);
  assert.doesNotMatch(headerSource, /key: "whiteLabel"/);
  assert.doesNotMatch(headerSource, /key: "integrations"/);
  assert.doesNotMatch(homepageSource, /href="\/pricing"/);
});

test("agency landing source uses crawlable language links and the workspace demo", () => {
  const source = readFileSync(
    new URL("./agency-homepage-client.tsx", import.meta.url),
    "utf8",
  );
  const headerSource = readFileSync(
    new URL("./agency-header.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /initialLanguage/);
  assert.match(headerSource, /getAgencyHomePath/);
  assert.match(source, /AgencyWorkspaceDemo/);
  assert.doesNotMatch(source, /setLanguage/);
});

test("public navigation exposes the demo route", () => {
  const source = readFileSync(
    new URL("../../components/navbar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /label: "Demo", href: "\/demo"/);
});

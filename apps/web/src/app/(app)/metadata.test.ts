import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readSource(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("authenticated route groups define route-specific metadata titles", () => {
  const appLayout = readSource("./layout.tsx");
  const adminLayout = readSource("./admin/layout.tsx");
  const settingsLayout = readSource("../(settings)/settings/layout.tsx");

  assert.match(appLayout, /title:\s*"Dashboard — WebHealth"/);
  assert.match(adminLayout, /title:\s*"Admin — WebHealth"/);
  assert.match(settingsLayout, /title:\s*"Settings — WebHealth"/);
  assert.doesNotMatch(appLayout, /Webhealth \| SEO & Analytics Monitoring/);
  assert.doesNotMatch(adminLayout, /Webhealth \| SEO & Analytics Monitoring/);
  assert.doesNotMatch(settingsLayout, /Webhealth \| SEO & Analytics Monitoring/);
});

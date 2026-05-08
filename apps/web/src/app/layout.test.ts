import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("root layout mounts Vercel Analytics", () => {
  const source = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

  assert.match(source, /from "\@\/components\/vercel-analytics"/);
  assert.match(source, /<VercelAnalytics\s*\/>/);
});

test("root layout reads the localized marketing request header for html lang", () => {
  const source = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

  assert.match(source, /headers\(\)/);
  assert.match(source, /x-webhealth-locale/);
  assert.match(source, /<html lang=\{locale\}/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("landing page skip link only becomes visible on keyboard-style focus", () => {
  const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /Skip to main content/);
  assert.match(source, /focus-visible:not-sr-only/);
  assert.doesNotMatch(source, /focus:not-sr-only/);
});

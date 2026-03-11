import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("command palette dialog declares a screen-reader title", () => {
  const source = readFileSync(new URL("./command-palette.tsx", import.meta.url), "utf8");

  assert.match(source, /DialogTitle/);
  assert.match(source, /<DialogTitle className="sr-only">Command palette<\/DialogTitle>/);
});

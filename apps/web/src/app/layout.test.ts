import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("root layout mounts Vercel Analytics", () => {
  const source = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");

  assert.match(source, /from "@vercel\/analytics\/next"/);
  assert.match(source, /<Analytics\s*\/>/);
});

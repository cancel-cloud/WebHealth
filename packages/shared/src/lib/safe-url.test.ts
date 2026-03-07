import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeHttpUrl, sanitizeHttpUrls } from "./safe-url";

test("sanitizeHttpUrl accepts https urls", () => {
  assert.equal(sanitizeHttpUrl("https://example.com/path?q=1"), "https://example.com/path?q=1");
});

test("sanitizeHttpUrl rejects dangerous schemes", () => {
  assert.equal(sanitizeHttpUrl("javascript:alert(1)"), null);
  assert.equal(sanitizeHttpUrl("data:text/html,hello"), null);
});

test("sanitizeHttpUrl only allows http when explicitly enabled", () => {
  assert.equal(sanitizeHttpUrl("http://example.com"), null);
  assert.equal(sanitizeHttpUrl("http://localhost:3000", { allowHttp: true }), "http://localhost:3000/");
});

test("sanitizeHttpUrls removes invalid values and deduplicates", () => {
  assert.deepEqual(
    sanitizeHttpUrls([
      "https://example.com",
      "HTTPS://example.com",
      "javascript:alert(1)",
      "https://example.com/",
    ]),
    ["https://example.com/"]
  );
});

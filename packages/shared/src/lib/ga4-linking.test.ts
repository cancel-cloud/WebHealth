import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateGa4DisplayNameLink,
  normalizeGooglePropertyHost,
} from "./ga4-linking";

test("normalizeGooglePropertyHost normalizes GSC domain properties and URLs", () => {
  assert.equal(normalizeGooglePropertyHost("sc-domain:www.Example.com"), "example.com");
  assert.equal(normalizeGooglePropertyHost("https://www.example.com/"), "example.com");
});

test("estimateGa4DisplayNameLink scores exact domain matches as high confidence", () => {
  assert.deepEqual(estimateGa4DisplayNameLink("sc-domain:example.com", "example.com"), {
    matched: true,
    confidence: "high",
    source: "auto_display_name",
  });
});

test("estimateGa4DisplayNameLink scores partial display-name matches as medium confidence", () => {
  assert.deepEqual(estimateGa4DisplayNameLink("sc-domain:example.com", "Example.com GA4 Property"), {
    matched: true,
    confidence: "medium",
    source: "auto_display_name",
  });
});

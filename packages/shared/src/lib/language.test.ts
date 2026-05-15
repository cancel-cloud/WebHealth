import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SUPPORTED_LANGUAGE,
  SUPPORTED_LANGUAGE_LABELS,
  getGoogleSeedLanguagePreference,
  normalizeSupportedLanguage,
  parseSupportedLanguage,
} from "./language";

test("normalizeSupportedLanguage maps Google and browser locales to supported languages", () => {
  assert.equal(normalizeSupportedLanguage("de"), "de");
  assert.equal(normalizeSupportedLanguage("de-DE"), "de");
  assert.equal(normalizeSupportedLanguage("en"), "en");
  assert.equal(normalizeSupportedLanguage("en-US"), "en");
  assert.equal(normalizeSupportedLanguage("EN_gb"), "en");
});

test("normalizeSupportedLanguage falls back to German for missing or unsupported values", () => {
  assert.equal(normalizeSupportedLanguage(null), DEFAULT_SUPPORTED_LANGUAGE);
  assert.equal(normalizeSupportedLanguage(undefined), DEFAULT_SUPPORTED_LANGUAGE);
  assert.equal(normalizeSupportedLanguage("fr-FR"), DEFAULT_SUPPORTED_LANGUAGE);
  assert.equal(normalizeSupportedLanguage(""), DEFAULT_SUPPORTED_LANGUAGE);
});

test("parseSupportedLanguage accepts only explicit supported language codes", () => {
  assert.equal(parseSupportedLanguage("de"), "de");
  assert.equal(parseSupportedLanguage("en"), "en");
  assert.equal(parseSupportedLanguage("de-DE"), null);
  assert.equal(parseSupportedLanguage("fr"), null);
  assert.equal(parseSupportedLanguage(null), null);
});

test("supported language labels are stable user-facing labels", () => {
  assert.deepEqual(SUPPORTED_LANGUAGE_LABELS, {
    de: "Deutsch",
    en: "English",
  });
});

test("getGoogleSeedLanguagePreference seeds only missing preferences", () => {
  assert.deepEqual(getGoogleSeedLanguagePreference(null, "en-US"), {
    preferredLanguage: "en",
    preferredLanguageSource: "google",
  });
  assert.equal(getGoogleSeedLanguagePreference("de", "en-US"), null);
});

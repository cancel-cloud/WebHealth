import assert from "node:assert/strict";
import test from "node:test";

import {
  COOKIE_CONSENT_STORAGE_KEY,
  getCookieConsentFromStorage,
  isGoogleAnalyticsEnabled,
  readCookieConsent,
  shouldShowCookieConsentBanner,
  writeCookieConsent,
} from "./cookie-consent.logic";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

test("missing or invalid storage values fall back to unknown consent", () => {
  assert.equal(getCookieConsentFromStorage(null), "unknown");
  assert.equal(getCookieConsentFromStorage("bogus"), "unknown");
  assert.equal(shouldShowCookieConsentBanner("unknown"), true);
  assert.equal(isGoogleAnalyticsEnabled("unknown"), false);
});

test("accepted consent persists and enables analytics", () => {
  const storage = new MemoryStorage();

  writeCookieConsent(storage, "accepted");

  assert.equal(storage.getItem(COOKIE_CONSENT_STORAGE_KEY), "accepted");
  assert.equal(readCookieConsent(storage), "accepted");
  assert.equal(shouldShowCookieConsentBanner("accepted"), false);
  assert.equal(isGoogleAnalyticsEnabled("accepted"), true);
});

test("declined consent persists and keeps analytics disabled", () => {
  const storage = new MemoryStorage();

  writeCookieConsent(storage, "declined");

  assert.equal(storage.getItem(COOKIE_CONSENT_STORAGE_KEY), "declined");
  assert.equal(readCookieConsent(storage), "declined");
  assert.equal(shouldShowCookieConsentBanner("declined"), false);
  assert.equal(isGoogleAnalyticsEnabled("declined"), false);
});

test("stored consent can be changed later via cookie settings", () => {
  const storage = new MemoryStorage();

  writeCookieConsent(storage, "accepted");
  writeCookieConsent(storage, "declined");

  assert.equal(readCookieConsent(storage), "declined");
  assert.equal(isGoogleAnalyticsEnabled(readCookieConsent(storage)), false);
});

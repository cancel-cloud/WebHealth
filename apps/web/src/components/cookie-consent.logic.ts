export type CookieConsentState = "unknown" | "accepted" | "declined";

type ReadStorage = Pick<Storage, "getItem">;
type WriteStorage = Pick<Storage, "setItem">;

export const COOKIE_CONSENT_STORAGE_KEY = "webhealth_cookie_consent_v1";
export const GOOGLE_ANALYTICS_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-3GH242QVM3";

export function getCookieConsentFromStorage(
  value: string | null | undefined,
): CookieConsentState {
  if (value === "accepted" || value === "declined") return value;
  return "unknown";
}

export function readCookieConsent(storage: ReadStorage): CookieConsentState {
  return getCookieConsentFromStorage(storage.getItem(COOKIE_CONSENT_STORAGE_KEY));
}

export function writeCookieConsent(
  storage: WriteStorage,
  value: Exclude<CookieConsentState, "unknown">,
) {
  storage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
}

export function shouldShowCookieConsentBanner(value: CookieConsentState) {
  return value === "unknown";
}

export function isGoogleAnalyticsEnabled(value: CookieConsentState) {
  return value === "accepted";
}

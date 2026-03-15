export type CookieConsentState = "unknown" | "accepted" | "declined";
export type GoogleConsentValue = "granted" | "denied";

export type GoogleConsentSettings = {
  ad_storage: GoogleConsentValue;
  ad_user_data: GoogleConsentValue;
  ad_personalization: GoogleConsentValue;
  analytics_storage: GoogleConsentValue;
  wait_for_update?: number;
};

type ReadStorage = Pick<Storage, "getItem">;
type WriteStorage = Pick<Storage, "setItem">;

export const COOKIE_CONSENT_STORAGE_KEY = "webhealth_cookie_consent_v1";
export const GOOGLE_ANALYTICS_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-3GH242QVM3";
export const GOOGLE_CONSENT_WAIT_FOR_UPDATE_MS = 2000;

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

export function buildGoogleConsentDefault(): GoogleConsentSettings {
  return {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: GOOGLE_CONSENT_WAIT_FOR_UPDATE_MS,
  };
}

export function buildGoogleConsentUpdate(
  value: CookieConsentState,
): GoogleConsentSettings {
  return {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: value === "accepted" ? "granted" : "denied",
  };
}

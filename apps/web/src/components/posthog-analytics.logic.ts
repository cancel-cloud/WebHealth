import {
  DEFAULT_POSTHOG_CAPTURE_HOST,
  DEFAULT_POSTHOG_UI_HOST,
  POSTHOG_BROWSER_DEFAULTS,
  POSTHOG_PERSON_PROFILES,
} from "@webhealth/shared/lib/product-events";
import type { CookieConsentState } from "./cookie-consent.logic";

type BrowserConfigInput = {
  key?: string | null;
  captureHost?: string | null;
  uiHost?: string | null;
};

type PosthogIdentityUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
};

type PosthogIdentityInput = {
  consent: CookieConsentState;
  initialized: boolean;
  currentIdentifiedUserId: string | null;
  user?: PosthogIdentityUser | null;
};

const SHARE_PROPERTY_TOKEN_PATH = /^\/share\/property\/[^/]+$/;
const SHARE_PROPERTY_REDACTED_PATH = "/share/property/[token]";
const POSTHOG_PLACEHOLDER_PATTERN = /^phc_replace_/i;

export type PosthogIdentityAction =
  | { type: "identify"; distinctId: string; properties: { email?: string; name?: string } }
  | { type: "reset" }
  | { type: "none" };

function normalizeHost(value: string | null | undefined, fallback: string) {
  return (value?.trim() || fallback).replace(/\/+$/, "");
}

export function buildPosthogBrowserConfig(input: BrowserConfigInput) {
  return {
    api_host: normalizeHost(input.captureHost, DEFAULT_POSTHOG_CAPTURE_HOST),
    ui_host: normalizeHost(input.uiHost, DEFAULT_POSTHOG_UI_HOST),
    defaults: POSTHOG_BROWSER_DEFAULTS,
    person_profiles: POSTHOG_PERSON_PROFILES,
    capture_pageview: false,
    autocapture: true,
  } as const;
}

export function isPosthogBrowserEnabled(
  consent: CookieConsentState,
  key: string | null | undefined,
) {
  const trimmed = key?.trim() ?? "";
  return consent === "accepted" && Boolean(trimmed) && !POSTHOG_PLACEHOLDER_PATTERN.test(trimmed);
}

export function sanitizeAnalyticsUrl(url: string) {
  const hasOrigin = /^[a-z][a-z\d+.-]*:\/\//i.test(url);
  const parsed = new URL(url, hasOrigin ? undefined : "https://webhealth.local");
  if (SHARE_PROPERTY_TOKEN_PATH.test(parsed.pathname)) {
    parsed.pathname = SHARE_PROPERTY_REDACTED_PATH;
  }
  parsed.search = "";
  parsed.hash = "";
  return hasOrigin ? parsed.toString() : parsed.pathname;
}

export function getPosthogIdentityAction(input: PosthogIdentityInput): PosthogIdentityAction {
  if (!input.initialized || input.consent !== "accepted") return { type: "none" };

  const userId = input.user?.id?.trim();
  if (!userId) {
    return input.currentIdentifiedUserId ? { type: "reset" } : { type: "none" };
  }

  if (input.currentIdentifiedUserId === userId) return { type: "none" };

  return {
    type: "identify",
    distinctId: userId,
    properties: {
      ...(input.user?.email ? { email: input.user.email } : {}),
      ...(input.user?.name ? { name: input.user.name } : {}),
    },
  };
}

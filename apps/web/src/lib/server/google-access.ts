import {
  type GoogleAccessHealth,
  getGoogleAccessHealth,
} from "@webhealth/shared/lib/google-access";
import { getGoogleAccountTokensForUser } from "@webhealth/shared/lib/provider-tokens";

export async function getGoogleAccessHealthForUser(userId: string) {
  const account = await getGoogleAccountTokensForUser(userId);
  return getGoogleAccessHealth({ account });
}

export function shouldBlockGoogleAction(health: GoogleAccessHealth) {
  return health.state !== "ok";
}

export function toGoogleAccessPublicError(health: GoogleAccessHealth) {
  switch (health.state) {
    case "google_account_not_linked":
      return {
        status: 400,
        body: {
          code: "GOOGLE_ACCOUNT_NOT_LINKED",
          error: "Google account not linked. Reconnect Google to continue.",
          health,
        },
      };
    case "google_auth_relogin_required":
      return {
        status: 401,
        body: {
          code: "GOOGLE_AUTH_RELOGIN_REQUIRED",
          error: "Google authorization expired. Please sign in again.",
          health,
        },
      };
    case "gsc_access_missing":
      return {
        status: 403,
        body: {
          code: "GOOGLE_GSC_ACCESS_MISSING",
          error:
            "Google Search Console access is missing. Reconnect Google and grant Search Console access to continue.",
          health,
        },
      };
    case "ga4_access_missing":
      return {
        status: 403,
        body: {
          code: "GOOGLE_GA4_ACCESS_MISSING",
          error:
            "Google Analytics access is missing. Reconnect Google and grant Analytics access to continue.",
          health,
        },
      };
    case "gsc_and_ga4_access_missing":
      return {
        status: 403,
        body: {
          code: "GOOGLE_GSC_AND_GA4_ACCESS_MISSING",
          error:
            "Google Search Console and Analytics access are missing. Reconnect Google and grant both permissions to continue.",
          health,
        },
      };
    default:
      return null;
  }
}

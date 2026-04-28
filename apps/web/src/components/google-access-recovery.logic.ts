import type {
  GoogleAccessHealth,
  GoogleAccessState,
  GoogleMissingGrant,
} from "@webhealth/shared/lib/google-access";

export type GoogleAccessIssue = Pick<GoogleAccessHealth, "state" | "missingGrants">;

export function getGoogleAccessIssueFromCode(code: string | null | undefined): GoogleAccessIssue | null {
  switch (code) {
    case "GOOGLE_ACCOUNT_NOT_LINKED":
      return { state: "google_account_not_linked", missingGrants: ["gsc", "ga4"] };
    case "GOOGLE_AUTH_RELOGIN_REQUIRED":
      return { state: "google_auth_relogin_required", missingGrants: ["gsc", "ga4"] };
    case "GOOGLE_GSC_ACCESS_MISSING":
      return { state: "gsc_access_missing", missingGrants: ["gsc"] };
    case "GOOGLE_GA4_ACCESS_MISSING":
      return { state: "ga4_access_missing", missingGrants: ["ga4"] };
    case "GOOGLE_GSC_AND_GA4_ACCESS_MISSING":
      return { state: "gsc_and_ga4_access_missing", missingGrants: ["gsc", "ga4"] };
    default:
      return null;
  }
}

function formatMissingGrants(missingGrants: GoogleMissingGrant[]) {
  if (missingGrants.length === 2) return "Google Search Console and Analytics";
  return missingGrants[0] === "gsc" ? "Google Search Console" : "Google Analytics";
}

function getDialogTitle(state: GoogleAccessState) {
  if (state === "google_auth_relogin_required") {
    return "Google connection expired";
  }
  if (state === "google_account_not_linked") {
    return "Reconnect Google to continue";
  }
  return "Google access needs attention";
}

export function getGoogleAccessToastModel(issue: GoogleAccessIssue) {
  return {
    title: "Google access incomplete",
    description:
      issue.state === "google_auth_relogin_required"
        ? "Your Google connection expired. Reconnect Google to restore Search Console and Analytics access."
        : `${formatMissingGrants(issue.missingGrants)} access is missing. Review access to reconnect your workspace.`,
    actionLabel: "Review access",
  };
}

export function getGoogleAccessDialogModel(issue: GoogleAccessIssue) {
  const reconnectSteps =
    issue.state === "google_auth_relogin_required"
      ? "Your previous Google authorization expired. Sign in again and confirm the required access so WebHealth can sync and refresh your properties."
      : `WebHealth needs ${formatMissingGrants(issue.missingGrants)} access to sync and refresh your properties. Reconnect Google, review the consent screen, and approve the required access.`;

  return {
    title: getDialogTitle(issue.state),
    description: reconnectSteps,
    primaryActionLabel: "Reconnect Google",
  };
}

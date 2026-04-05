import { fetchGa4Properties, fetchGscProperties, getGoogleAuthClient } from "./google/api";

export const GSC_READONLY_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
export const GA4_READONLY_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export type GoogleAccessState =
  | "ok"
  | "google_account_not_linked"
  | "google_auth_relogin_required"
  | "gsc_access_missing"
  | "ga4_access_missing"
  | "gsc_and_ga4_access_missing";

export type GoogleMissingGrant = "gsc" | "ga4";

export type GoogleAccessHealth = {
  state: GoogleAccessState;
  missingGrants: GoogleMissingGrant[];
  hasIssue: boolean;
  grantedScopes: string[];
};

type GoogleAccountLike = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  scope?: string | null;
};

type GoogleAccessHealthInput = {
  account: GoogleAccountLike | null;
  fetchGsc?: (authClient: ReturnType<typeof getGoogleAuthClient>) => Promise<unknown>;
  fetchGa4?: (authClient: ReturnType<typeof getGoogleAuthClient>) => Promise<unknown>;
};

function buildGoogleAccessHealth(
  state: GoogleAccessState,
  input: { missingGrants?: GoogleMissingGrant[]; grantedScopes?: string[] } = {},
): GoogleAccessHealth {
  return {
    state,
    missingGrants: input.missingGrants ?? [],
    hasIssue: state !== "ok",
    grantedScopes: input.grantedScopes ?? [],
  };
}

function parseGrantedScopes(scope: string | null | undefined) {
  return (scope ?? "")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function getGoogleErrorDetails(error: unknown) {
  const record = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
    response?: { status?: unknown; data?: unknown };
    errors?: Array<{ message?: unknown; reason?: unknown }>;
  };
  const responseData = record?.response?.data as
    | { error?: { message?: unknown; status?: unknown; details?: Array<{ reason?: unknown }> } }
    | undefined;

  const status = [
    record?.status,
    record?.code,
    record?.response?.status,
  ].find((value) => typeof value === "number");

  const parts = [
    error instanceof Error ? error.message : null,
    typeof record?.message === "string" ? record.message : null,
    typeof responseData?.error?.message === "string" ? responseData.error.message : null,
    ...(Array.isArray(record?.errors)
      ? record.errors.flatMap((item) =>
          [item?.message, item?.reason].filter((value): value is string => typeof value === "string")
        )
      : []),
    ...(Array.isArray(responseData?.error?.details)
      ? responseData.error.details.flatMap((item) =>
          typeof item?.reason === "string" ? [item.reason] : []
        )
      : []),
  ];

  const message = parts.filter(Boolean).join(" | ");

  return { status: typeof status === "number" ? status : null, message };
}

function isReloginRequiredError(error: unknown) {
  const { status, message } = getGoogleErrorDetails(error);
  if (status === 401) return true;
  return /invalid_grant|invalid credentials|invalid_credentials|unauthorized/i.test(message);
}

function isMissingGrantError(error: unknown) {
  const { status, message } = getGoogleErrorDetails(error);
  if (status === 403) {
    return /insufficient|permission|scope|forbidden|access denied/i.test(message);
  }
  return /insufficient authentication scopes|insufficientpermissions|permission denied|forbidden/i.test(message);
}

function buildMissingGrantState(missingGrants: GoogleMissingGrant[], grantedScopes: string[]) {
  if (missingGrants.length === 0) {
    return buildGoogleAccessHealth("ok", { grantedScopes });
  }
  if (missingGrants.length === 2) {
    return buildGoogleAccessHealth("gsc_and_ga4_access_missing", {
      missingGrants,
      grantedScopes,
    });
  }
  return buildGoogleAccessHealth(
    missingGrants[0] === "gsc" ? "gsc_access_missing" : "ga4_access_missing",
    {
      missingGrants,
      grantedScopes,
    },
  );
}

function sortMissingGrants(missingGrants: Iterable<GoogleMissingGrant>) {
  const order: Record<GoogleMissingGrant, number> = { gsc: 0, ga4: 1 };
  return [...missingGrants].sort((left, right) => order[left] - order[right]);
}

export async function getGoogleAccessHealth({
  account,
  fetchGsc = fetchGscProperties,
  fetchGa4 = fetchGa4Properties,
}: GoogleAccessHealthInput): Promise<GoogleAccessHealth> {
  if (!account?.accessToken) {
    return buildGoogleAccessHealth("google_account_not_linked", {
      missingGrants: ["gsc", "ga4"],
    });
  }

  const grantedScopes = parseGrantedScopes(account.scope);
  const authClient = getGoogleAuthClient(
    account.accessToken,
    account.refreshToken ?? undefined,
    account.accessTokenExpiresAt ?? null,
  );

  const [gscResult, ga4Result] = await Promise.allSettled([
    fetchGsc(authClient),
    fetchGa4(authClient),
  ]);

  const errors = [gscResult, ga4Result]
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);

  if (errors.some((error) => isReloginRequiredError(error))) {
    return buildGoogleAccessHealth("google_auth_relogin_required", {
      missingGrants: ["gsc", "ga4"],
      grantedScopes,
    });
  }

  const missingGrants = new Set<GoogleMissingGrant>();

  if (gscResult.status === "rejected") {
    if (!isMissingGrantError(gscResult.reason)) throw gscResult.reason;
    missingGrants.add("gsc");
  }

  if (ga4Result.status === "rejected") {
    if (!isMissingGrantError(ga4Result.reason)) throw ga4Result.reason;
    missingGrants.add("ga4");
  }

  return buildMissingGrantState(sortMissingGrants(missingGrants), grantedScopes);
}

export function getGoogleAccessIssueCode(health: GoogleAccessHealth) {
  switch (health.state) {
    case "google_account_not_linked":
      return "GOOGLE_ACCOUNT_NOT_LINKED";
    case "google_auth_relogin_required":
      return "GOOGLE_AUTH_RELOGIN_REQUIRED";
    case "gsc_access_missing":
      return "GOOGLE_GSC_ACCESS_MISSING";
    case "ga4_access_missing":
      return "GOOGLE_GA4_ACCESS_MISSING";
    case "gsc_and_ga4_access_missing":
      return "GOOGLE_GSC_AND_GA4_ACCESS_MISSING";
    default:
      return null;
  }
}

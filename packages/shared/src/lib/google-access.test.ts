import assert from "node:assert/strict";
import test from "node:test";

import {
  GA4_READONLY_SCOPE,
  GSC_READONLY_SCOPE,
  getGoogleAccessHealth,
  getGoogleAccessIssueCode,
} from "./google-access";

const baseAccount = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  idToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  scope: [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    GSC_READONLY_SCOPE,
    GA4_READONLY_SCOPE,
  ].join(" "),
};

test("returns account-not-linked when no google account exists", async () => {
  const health = await getGoogleAccessHealth({
    account: null,
  });

  assert.equal(health.state, "google_account_not_linked");
  assert.deepEqual(health.missingGrants, ["gsc", "ga4"]);
  assert.equal(getGoogleAccessIssueCode(health), "GOOGLE_ACCOUNT_NOT_LINKED");
});

test("returns relogin-required when google credentials are expired", async () => {
  const health = await getGoogleAccessHealth({
    account: baseAccount,
    fetchGsc: async () => {
      throw new Error("invalid_grant");
    },
    fetchGa4: async () => {
      throw new Error("invalid_grant");
    },
  });

  assert.equal(health.state, "google_auth_relogin_required");
  assert.deepEqual(health.missingGrants, ["gsc", "ga4"]);
  assert.equal(getGoogleAccessIssueCode(health), "GOOGLE_AUTH_RELOGIN_REQUIRED");
});

test("returns missing-gsc when gsc access is denied", async () => {
  const health = await getGoogleAccessHealth({
    account: baseAccount,
    fetchGsc: async () => {
      const error = new Error("Request had insufficient authentication scopes.");
      (error as Error & { status?: number }).status = 403;
      throw error;
    },
    fetchGa4: async () => [],
  });

  assert.equal(health.state, "gsc_access_missing");
  assert.deepEqual(health.missingGrants, ["gsc"]);
  assert.equal(getGoogleAccessIssueCode(health), "GOOGLE_GSC_ACCESS_MISSING");
});

test("returns missing-ga4 when ga4 access is denied", async () => {
  const health = await getGoogleAccessHealth({
    account: baseAccount,
    fetchGsc: async () => [],
    fetchGa4: async () => {
      const error = new Error("insufficientPermissions");
      (error as Error & { code?: number }).code = 403;
      throw error;
    },
  });

  assert.equal(health.state, "ga4_access_missing");
  assert.deepEqual(health.missingGrants, ["ga4"]);
  assert.equal(getGoogleAccessIssueCode(health), "GOOGLE_GA4_ACCESS_MISSING");
});

test("returns missing-both when stored scopes omit both property grants", async () => {
  const health = await getGoogleAccessHealth({
    account: {
      ...baseAccount,
      scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
    },
    fetchGsc: async () => {
      throw new Error("Request had insufficient authentication scopes.");
    },
    fetchGa4: async () => {
      throw new Error("insufficientPermissions");
    },
  });

  assert.equal(health.state, "gsc_and_ga4_access_missing");
  assert.deepEqual(health.missingGrants, ["gsc", "ga4"]);
  assert.equal(getGoogleAccessIssueCode(health), "GOOGLE_GSC_AND_GA4_ACCESS_MISSING");
});

test("treats successful live checks as healthy even when stored scopes are missing", async () => {
  const health = await getGoogleAccessHealth({
    account: {
      ...baseAccount,
      scope: null,
    },
    fetchGsc: async () => [],
    fetchGa4: async () => [],
  });

  assert.equal(health.state, "ok");
  assert.deepEqual(health.missingGrants, []);
  assert.equal(getGoogleAccessIssueCode(health), null);
});

test("returns ok when both google property grants are healthy", async () => {
  const health = await getGoogleAccessHealth({
    account: baseAccount,
    fetchGsc: async () => [],
    fetchGa4: async () => [],
  });

  assert.equal(health.state, "ok");
  assert.deepEqual(health.missingGrants, []);
  assert.equal(getGoogleAccessIssueCode(health), null);
});

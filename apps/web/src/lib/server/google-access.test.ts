import assert from "node:assert/strict";
import test from "node:test";

import {
  toGoogleAccessPublicError,
  shouldBlockGoogleAction,
} from "./google-access";

test("healthy google access does not block actions", () => {
  assert.equal(shouldBlockGoogleAction({ state: "ok", missingGrants: [], hasIssue: false, grantedScopes: [] }), false);
});

test("relogin-required maps to the existing 401 contract", () => {
  const publicError = toGoogleAccessPublicError({
    state: "google_auth_relogin_required",
    missingGrants: ["gsc", "ga4"],
    hasIssue: true,
    grantedScopes: [],
  });

  assert.equal(publicError.status, 401);
  assert.equal(publicError.body.code, "GOOGLE_AUTH_RELOGIN_REQUIRED");
  assert.match(publicError.body.error, /sign in again/i);
});

test("missing gsc access maps to a specific safe message", () => {
  const publicError = toGoogleAccessPublicError({
    state: "gsc_access_missing",
    missingGrants: ["gsc"],
    hasIssue: true,
    grantedScopes: [],
  });

  assert.equal(publicError.status, 403);
  assert.equal(publicError.body.code, "GOOGLE_GSC_ACCESS_MISSING");
  assert.match(publicError.body.error, /search console/i);
});

test("missing both grants maps to a combined safe message", () => {
  const publicError = toGoogleAccessPublicError({
    state: "gsc_and_ga4_access_missing",
    missingGrants: ["gsc", "ga4"],
    hasIssue: true,
    grantedScopes: [],
  });

  assert.equal(publicError.status, 403);
  assert.equal(publicError.body.code, "GOOGLE_GSC_AND_GA4_ACCESS_MISSING");
  assert.match(publicError.body.error, /search console/i);
  assert.match(publicError.body.error, /analytics/i);
});

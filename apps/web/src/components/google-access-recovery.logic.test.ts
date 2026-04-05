import assert from "node:assert/strict";
import test from "node:test";

import {
  getGoogleAccessDialogModel,
  getGoogleAccessIssueFromCode,
  getGoogleAccessToastModel,
} from "./google-access-recovery.logic";

test("maps missing-gsc route errors to a shared issue model", () => {
  const issue = getGoogleAccessIssueFromCode("GOOGLE_GSC_ACCESS_MISSING");

  assert.deepEqual(issue, {
    state: "gsc_access_missing",
    missingGrants: ["gsc"],
  });
});

test("builds compact toast copy for missing both grants", () => {
  const toastModel = getGoogleAccessToastModel({
    state: "gsc_and_ga4_access_missing",
    missingGrants: ["gsc", "ga4"],
  });

  assert.match(toastModel.title, /google access incomplete/i);
  assert.match(toastModel.description, /search console/i);
  assert.match(toastModel.description, /analytics/i);
  assert.equal(toastModel.actionLabel, "Review access");
});

test("builds detailed dialog copy for relogin-required issues", () => {
  const dialogModel = getGoogleAccessDialogModel({
    state: "google_auth_relogin_required",
    missingGrants: ["gsc", "ga4"],
  });

  assert.match(dialogModel.title, /google connection expired/i);
  assert.match(dialogModel.description, /sign in again/i);
  assert.equal(dialogModel.primaryActionLabel, "Reconnect Google");
});

import assert from "node:assert/strict";
import test from "node:test";

import { extractReportIdFromArtifactKey } from "./artifact-server";
import { mintArtifactDownloadToken, verifyArtifactDownloadToken } from "@webhealth/shared/lib/artifact-token";

test("extracts report id from a valid artifact key", () => {
  const reportId = extractReportIdFromArtifactKey(
    "reports/rep_6qG1TZ474M9W/1772208322489-seo-report.xlsx"
  );

  assert.equal(reportId, "rep_6qG1TZ474M9W");
});

test("returns null when artifact key does not contain a report id", () => {
  const reportId = extractReportIdFromArtifactKey("not-a-valid-artifact-key");

  assert.equal(reportId, null);
});

test("artifact tokens are scoped to report and key", () => {
  process.env.ARTIFACT_TOKEN_SECRET = "artifact-secret";
  const token = mintArtifactDownloadToken({
    artifactKey: "reports/rep_6qG1TZ474M9W/1772208322489-seo-report.xlsx",
    reportId: "rep_6qG1TZ474M9W",
    ttlSeconds: 60,
  });

  assert.equal(
    verifyArtifactDownloadToken(token)?.artifactKey,
    "reports/rep_6qG1TZ474M9W/1772208322489-seo-report.xlsx"
  );
});

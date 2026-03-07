import assert from "node:assert/strict";
import test from "node:test";

import { mintArtifactDownloadToken, verifyArtifactDownloadToken } from "./artifact-token";

test("minted artifact tokens verify and preserve payload", () => {
  process.env.ARTIFACT_TOKEN_SECRET = "artifact-secret";
  const token = mintArtifactDownloadToken({
    artifactKey: "reports/rep_123/123-seo-report.xlsx",
    reportId: "rep_123",
    ttlSeconds: 60,
  });

  assert.deepEqual(verifyArtifactDownloadToken(token), {
    artifactKey: "reports/rep_123/123-seo-report.xlsx",
    reportId: "rep_123",
    exp: verifyArtifactDownloadToken(token)?.exp,
  });
});

test("tampered artifact tokens are rejected", () => {
  process.env.ARTIFACT_TOKEN_SECRET = "artifact-secret";
  const token = mintArtifactDownloadToken({
    artifactKey: "reports/rep_123/123-seo-report.xlsx",
    reportId: "rep_123",
    ttlSeconds: 60,
  });
  assert.equal(verifyArtifactDownloadToken(`${token}x`), null);
});

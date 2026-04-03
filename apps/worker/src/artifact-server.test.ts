import assert from "node:assert/strict";
import test from "node:test";

import { buildWorkerReadyResponse, extractReportIdFromArtifactKey } from "./artifact-server";
import { createWorkerRuntimeState, markDatabaseReady, markLoopTick } from "./runtime-state";
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

test("buildWorkerReadyResponse returns 503 when the worker loop is not ready", () => {
  const snapshot = buildWorkerReadyResponse(
    createWorkerRuntimeState({ artifactServerExpected: true }),
  );

  assert.equal(snapshot.statusCode, 503);
  assert.equal(snapshot.body.ok, false);
});

test("buildWorkerReadyResponse returns 200 after the worker loop is healthy", () => {
  const state = createWorkerRuntimeState({ artifactServerExpected: false });
  markDatabaseReady(state, 100);
  markLoopTick(state, 110);

  const snapshot = buildWorkerReadyResponse(state, { nowMs: 120, staleAfterMs: 1_000 });

  assert.equal(snapshot.statusCode, 200);
  assert.equal(snapshot.body.ok, true);
});

import assert from "node:assert/strict";
import test from "node:test";

import { resolveReportArtifactBinary } from "./resolve-report-artifact";

test("returns local artifact bytes when local storage has the file", async () => {
  let fetchCalled = false;
  const localBytes = new TextEncoder().encode("local-artifact");

  const result = await resolveReportArtifactBinary({
    artifactKey: "reports/rep_123/123-seo-report.xlsx",
    workerBaseUrl: undefined,
    artifactToken: undefined,
    readLocalArtifact: async () => localBytes.buffer,
    fetchImpl: async () => {
      fetchCalled = true;
      return new Response(null, { status: 500 });
    },
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(Buffer.from(result.data).toString("utf8"), "local-artifact");
  assert.equal(fetchCalled, false);
});

test("fetches from worker when local artifact is missing", async () => {
  const workerBytes = new TextEncoder().encode("worker-artifact");
  let observedUrl = "";
  let observedAuth = "";

  const result = await resolveReportArtifactBinary({
    artifactKey: "reports/rep_456/456-seo-report.xlsx",
    workerBaseUrl: "http://worker.internal:9100",
    artifactToken: "signed-token",
    readLocalArtifact: async () => null,
    fetchImpl: async (input, init) => {
      observedUrl = String(input);
      return new Response(workerBytes.buffer, { status: 200 });
    },
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(Buffer.from(result.data).toString("utf8"), "worker-artifact");
  assert.equal(
    observedUrl,
    "http://worker.internal:9100/artifacts?token=signed-token"
  );
});

test("returns 502 when worker download fails at network level", async () => {
  const result = await resolveReportArtifactBinary({
    artifactKey: "reports/rep_789/789-seo-report.xlsx",
    workerBaseUrl: "http://worker.internal:9100",
    artifactToken: "signed-token",
    readLocalArtifact: async () => null,
    fetchImpl: async () => {
      throw new Error("connect ECONNREFUSED");
    },
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 502);
  assert.equal(result.code, "ARTIFACT_WORKER_UNREACHABLE");
});

test("returns 503 when neither local nor worker artifact source is available", async () => {
  const result = await resolveReportArtifactBinary({
    artifactKey: "reports/rep_abc/111-seo-report.xlsx",
    workerBaseUrl: undefined,
    artifactToken: undefined,
    readLocalArtifact: async () => null,
    fetchImpl: async () => new Response(null, { status: 500 }),
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 503);
  assert.equal(result.code, "ARTIFACT_SERVICE_UNAVAILABLE");
});

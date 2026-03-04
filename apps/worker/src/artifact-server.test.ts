import assert from "node:assert/strict";
import test from "node:test";

import { extractReportIdFromArtifactKey } from "./artifact-server";

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

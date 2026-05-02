import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProductEventDetails,
  normalizeLogDetails,
  normalizeProductEventStatus,
  sortAndLimitActivityLogs,
} from "./route.logic";

test("normalizeProductEventStatus maps background event suffixes", () => {
  assert.equal(normalizeProductEventStatus("ai_run_queued"), "queued");
  assert.equal(normalizeProductEventStatus("ai_run_started"), "started");
  assert.equal(normalizeProductEventStatus("ai_run_failed"), "failed");
  assert.equal(normalizeProductEventStatus("snapshot_captured"), "success");
});

test("buildProductEventDetails includes event metadata and object properties", () => {
  assert.deepEqual(
    buildProductEventDetails({
      source: "snapshot",
      entityType: "snapshot",
      entityId: "snap_1",
      properties: { propertyId: "gsc_1" },
    }),
    {
      source: "snapshot",
      entityType: "snapshot",
      entityId: "snap_1",
      propertyId: "gsc_1",
    },
  );
});

test("normalizeLogDetails keeps object details only", () => {
  assert.deepEqual(normalizeLogDetails({ metricsJobId: "job_1" }), { metricsJobId: "job_1" });
  assert.equal(normalizeLogDetails(null), null);
  assert.equal(normalizeLogDetails("not-json-object"), null);
});

test("sortAndLimitActivityLogs orders newest mixed activity first", () => {
  const logs = sortAndLimitActivityLogs([
    {
      id: "old",
      action: "property_sync",
      status: "success",
      details: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      triggeredByEmail: null,
      targetUserEmail: null,
    },
    {
      id: "new",
      action: "ai_run_completed",
      status: "success",
      details: null,
      createdAt: "2026-01-02T00:00:00.000Z",
      triggeredByEmail: null,
      targetUserEmail: null,
    },
  ], 1);

  assert.deepEqual(logs.map((log) => log.id), ["new"]);
});

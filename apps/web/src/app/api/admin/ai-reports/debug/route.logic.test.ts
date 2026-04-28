import assert from "node:assert/strict";
import test from "node:test";

import { buildUnifiedJobActivity } from "./route.logic";

test("buildUnifiedJobActivity merges source-data and property refresh activity", () => {
  const activity = buildUnifiedJobActivity({
    metricsJobs: [
      {
        id: "mbj_1",
        teamId: "team_1",
        targetPropertyId: "gsc_sc-domain:example.com",
        includeGsc: true,
        includeGa4: true,
        reason: "manual_backfill",
        status: "processing",
        triggerSource: "manual",
        totals: { gscFetchedDates: 2, ga4FetchedDates: 2 },
        error: null,
        attempts: 1,
        maxAttempts: 2,
        claimedBy: "mbw_1",
        claimExpiresAt: new Date("2026-04-01T09:08:00.000Z"),
        heartbeatAt: new Date("2026-04-01T09:06:00.000Z"),
        createdAt: new Date("2026-04-01T09:01:00.000Z"),
        startedAt: new Date("2026-04-01T09:02:00.000Z"),
        finishedAt: null,
      },
    ],
    propertyRefreshJobs: [
      {
        id: "prj_1",
        teamId: "team_2",
        propertyId: "gsc_sc-domain:site.test",
        jobType: "decision_refresh",
        status: "queued",
        phase: "queued",
        message: "Decision refresh queued",
        progressMeta: null,
        lastError: null,
        attempts: 0,
        maxAttempts: 2,
        claimedBy: null,
        claimExpiresAt: null,
        heartbeatAt: null,
        createdAt: new Date("2026-04-01T09:04:00.000Z"),
        updatedAt: new Date("2026-04-01T09:04:00.000Z"),
        startedAt: null,
        finishedAt: null,
      },
    ],
  });

  assert.deepEqual(
    activity.items.map((item) => item.id),
    ["mbj_1", "prj_1"],
  );
  assert.equal(activity.counts.sourceData.active, 1);
  assert.equal(activity.counts.propertyRefresh.queued, 1);
  assert.equal(activity.items[0]?.family, "source_data");
  assert.equal(activity.items[0]?.usage?.gscFetchedDates, 2);
});

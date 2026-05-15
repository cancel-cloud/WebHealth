import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOpenAICostsApiUrl,
  mapOpenAICostBucketToDailyRows,
  resolveOpenAICostReconciliationWindow,
} from "./cost-reconciler";

test("resolveOpenAICostReconciliationWindow defaults to the last 90 complete days", () => {
  const window = resolveOpenAICostReconciliationWindow({
    now: new Date("2026-05-15T12:00:00Z"),
  });

  assert.equal(window.startDate, "2026-02-14");
  assert.equal(window.endDate, "2026-05-15");
  assert.equal(window.startTime, 1771027200);
  assert.equal(window.endTime, 1778803200);
});

test("buildOpenAICostsApiUrl requests daily project and line item cost buckets", () => {
  const url = buildOpenAICostsApiUrl({
    baseUrl: "https://api.openai.com/v1",
    startTime: 1771027200,
    endTime: 1778889600,
    limit: 31,
  });

  assert.equal(url.toString(), "https://api.openai.com/v1/organization/costs?start_time=1771027200&end_time=1778889600&bucket_width=1d&limit=31&group_by=project_id&group_by=line_item");
});

test("mapOpenAICostBucketToDailyRows maps Costs API buckets to daily upsert rows", () => {
  const rows = mapOpenAICostBucketToDailyRows({
    object: "bucket",
    start_time: 1771027200,
    end_time: 1771113600,
    results: [
      {
        object: "organization.costs.result",
        amount: { value: 1.25, currency: "usd" },
        project_id: "proj_1",
        line_item: "Responses API",
      },
      {
        object: "organization.costs.result",
        amount: { value: 0.5, currency: "usd" },
        project_id: null,
        line_item: null,
      },
    ],
  });

  assert.deepEqual(rows.map(({ rawBucket: _rawBucket, ...row }) => row), [
    {
      id: "oaicost_2026-02-14_proj_1_Responses_API",
      sourceDate: "2026-02-14",
      projectId: "proj_1",
      lineItem: "Responses API",
      amountUsd: "1.250000",
      currency: "usd",
    },
    {
      id: "oaicost_2026-02-14_org_unattributed_unclassified",
      sourceDate: "2026-02-14",
      projectId: null,
      lineItem: null,
      amountUsd: "0.500000",
      currency: "usd",
    },
  ]);
});

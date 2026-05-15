import assert from "node:assert/strict";
import test from "node:test";
import {
  getPropertyRefreshClaimFilter,
  getPropertyRefreshTriggerSource,
  matchesPropertyRefreshPayload,
  shouldSupersedePropertyRefreshJob,
  buildPropertyPageRegistryChanges,
  type PropertyPageRegistryInput,
  type PropertyRefreshTriggerSource,
} from "./property-refresh";

test("matchesPropertyRefreshPayload requires an exact dashboard window match", () => {
  assert.equal(
    matchesPropertyRefreshPayload(
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
    ),
    true,
  );

  assert.equal(
    matchesPropertyRefreshPayload(
      {
        preset: "last_28d",
        compareMode: "none",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
    ),
    false,
  );

  assert.equal(
    matchesPropertyRefreshPayload(
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-25",
        endDate: "2026-04-21",
      },
      {
        preset: "last_28d",
        compareMode: "previous_period",
        startDate: "2026-03-26",
        endDate: "2026-04-22",
      },
    ),
    false,
  );
});

test("manual property refresh jobs supersede automation but automation does not supersede manual work", () => {
  assert.equal(
    shouldSupersedePropertyRefreshJob({
      incomingSource: "manual",
      existingSource: "automation",
    }),
    true,
  );
  assert.equal(
    shouldSupersedePropertyRefreshJob({
      incomingSource: "automation",
      existingSource: "manual",
    }),
    false,
  );
  assert.equal(
    shouldSupersedePropertyRefreshJob({
      incomingSource: "automation",
      existingSource: "automation",
    }),
    true,
  );
});

test("property refresh claim filters keep manual and automation lanes separate", () => {
  assert.equal(getPropertyRefreshTriggerSource({}), "manual");
  assert.equal(getPropertyRefreshTriggerSource({ triggerSource: "automation" }), "automation");
  assert.equal(getPropertyRefreshTriggerSource({ triggerSource: "scheduler" }), "automation");
  assert.equal(getPropertyRefreshTriggerSource({ triggerSource: "unexpected" }), "manual");

  const manualFilter = getPropertyRefreshClaimFilter("manual");
  const automationFilter = getPropertyRefreshClaimFilter("automation");
  const allFilter = getPropertyRefreshClaimFilter("all");

  const payloads: Array<{ payload: Record<string, unknown> | null; source: PropertyRefreshTriggerSource }> = [
    { payload: null, source: "manual" },
    { payload: {}, source: "manual" },
    { payload: { triggerSource: "manual" }, source: "manual" },
    { payload: { triggerSource: "automation" }, source: "automation" },
    { payload: { triggerSource: "scheduler" }, source: "automation" },
  ];

  assert.deepEqual(payloads.filter((item) => manualFilter(item.payload)).map((item) => item.source), [
    "manual",
    "manual",
    "manual",
  ]);
  assert.deepEqual(payloads.filter((item) => automationFilter(item.payload)).map((item) => item.source), [
    "automation",
    "automation",
  ]);
  assert.equal(payloads.filter((item) => allFilter(item.payload)).length, payloads.length);
});

test("buildPropertyPageRegistryChanges detects new, changed, unchanged, and removed pages", () => {
  const existing: PropertyPageRegistryInput[] = [
    {
      id: "reg_existing",
      canonicalUrl: "https://example.com/old",
      currentFingerprintHash: "unchanged",
      isActive: true,
      lastChangedAt: new Date("2026-04-01T00:00:00.000Z"),
    },
    {
      id: "reg_changed",
      canonicalUrl: "https://example.com/changed",
      currentFingerprintHash: "previous",
      isActive: true,
      lastChangedAt: new Date("2026-04-02T00:00:00.000Z"),
    },
    {
      id: "reg_removed",
      canonicalUrl: "https://example.com/removed",
      currentFingerprintHash: "removed",
      isActive: true,
      lastChangedAt: null,
    },
  ];

  const result = buildPropertyPageRegistryChanges({
    existing,
    pages: [
      {
        url: "https://example.com/old",
        canonicalUrl: "https://example.com/old",
        title: "Old",
        metaDescription: "Meta",
        h1Texts: ["H1"],
        h1Count: 1,
        issues: [],
        visibleTextExcerpt: "Body",
      },
      {
        url: "https://example.com/changed",
        canonicalUrl: "https://example.com/changed",
        title: "Changed",
        metaDescription: "Meta",
        h1Texts: ["H1"],
        h1Count: 1,
        issues: [],
        visibleTextExcerpt: "Body",
      },
      {
        url: "https://example.com/new",
        canonicalUrl: "https://example.com/new",
        title: "New",
        metaDescription: "Meta",
        h1Texts: ["H1"],
        h1Count: 1,
        issues: [],
        visibleTextExcerpt: "Body",
      },
    ],
    fingerprintPage: (page) => page.canonicalUrl === "https://example.com/old" ? "unchanged" : "next",
  });

  assert.deepEqual(result.siteChanges.newPages.map((page) => page.url), ["https://example.com/new"]);
  assert.deepEqual(result.siteChanges.changedPages.map((page) => page.url), ["https://example.com/changed"]);
  assert.deepEqual(result.siteChanges.removedPages.map((page) => page.url), ["https://example.com/removed"]);
  assert.equal(result.upserts.length, 3);
  assert.equal(result.removedIds[0], "reg_removed");
});

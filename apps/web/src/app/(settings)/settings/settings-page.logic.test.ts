import assert from "node:assert/strict";
import test from "node:test";

import {
  getSettingsPlanCardLayoutClassNames,
  getSettingsAccountSummary,
  normalizeSettingsResponse,
  resolveSettingsTab,
} from "./settings-page.logic";

test("getSettingsPlanCardLayoutClassNames keeps plan actions bottom-aligned", () => {
  assert.deepEqual(getSettingsPlanCardLayoutClassNames(), {
    card: "h-full rounded-lg border p-6 shadow-sm",
    featuredCard: "pt-8",
    content: "flex h-full flex-col gap-4",
    action: "mt-auto w-full",
  });
});

test("normalizeSettingsResponse coerces optional values into stable defaults", () => {
  assert.deepEqual(
    normalizeSettingsResponse({
      weeklyDigest: 1,
      reportComplete: 0,
      syncFailure: true,
      emailReceipts: undefined,
      reportLanguage: 42,
      teamTier: "pro",
      reportsThisMonth: 3,
      detailsThisMonth: "2",
    }),
    {
      weeklyDigest: true,
      reportComplete: false,
      syncFailure: true,
      emailReceipts: false,
      reportLanguage: "auto",
      isRestricted: false,
      restrictionMessage: null,
      adminContacts: [],
      teamTier: "pro",
      hasStripeCustomer: false,
      subscriptionCancelAt: null,
      reportsThisMonth: 3,
      reportsLimit: null,
      detailsThisMonth: 0,
      detailsLimit: null,
    }
  );
});

test("getSettingsAccountSummary returns a concise shell-ready summary", () => {
  const summary = getSettingsAccountSummary({
    teamTier: "pro",
    subscriptionCancelAt: "2026-04-15T00:00:00.000Z",
    reportsThisMonth: 4,
    reportsLimit: 10,
    detailsThisMonth: 1,
    detailsLimit: 5,
  });

  assert.equal(summary.planLabel, "Pro Plan");
  assert.equal(summary.planStatus, "Canceling");
  assert.equal(summary.usage.reportsThisMonth, 4);
  assert.equal(summary.usage.detailsLimit, 5);
});

test("getSettingsAccountSummary omits the current-plan label when the plan is active", () => {
  const summary = getSettingsAccountSummary({
    teamTier: "free",
    subscriptionCancelAt: null,
  });

  assert.equal(summary.planLabel, "Solo Plan");
  assert.equal(summary.planStatus, null);
});

test("resolveSettingsTab falls back to account for unknown values", () => {
  assert.equal(resolveSettingsTab("contact"), "contact");
  assert.equal(resolveSettingsTab("weird"), "account");
  assert.equal(resolveSettingsTab(null), "account");
});

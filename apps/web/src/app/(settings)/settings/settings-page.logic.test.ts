import assert from "node:assert/strict";
import test from "node:test";

import {
  canContinueToCheckout,
  getCheckoutConfirmationCopy,
  getSettingsSoloPlanAction,
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
      syncFailure: true,
      emailReceipts: undefined,
      teamTier: "studio",
      preferredLanguage: "en",
    }),
    {
      weeklyDigest: true,
      syncFailure: true,
      emailReceipts: false,
      isRestricted: false,
      restrictionMessage: null,
      adminContacts: [],
      teamTier: "studio",
      hasStripeCustomer: false,
      subscriptionCancelAt: null,
      preferredLanguage: "en",
    }
  );
});

test("normalizeSettingsResponse defaults unsupported preferred language to German", () => {
  assert.equal(
    normalizeSettingsResponse({ preferredLanguage: "fr" }).preferredLanguage,
    "de",
  );
});

test("getSettingsAccountSummary keeps the header focused on the active plan name", () => {
  const summary = getSettingsAccountSummary({
    teamTier: "studio",
    subscriptionCancelAt: "2026-04-15T00:00:00.000Z",
  });

  assert.equal(summary.planLabel, "Studio Plan");
  assert.equal(summary.planStatus, null);
});

test("getSettingsAccountSummary omits the current-plan label when the plan is active", () => {
  const summary = getSettingsAccountSummary({
    teamTier: "free",
    subscriptionCancelAt: null,
  });

  assert.equal(summary.planLabel, "Solo Plan");
  assert.equal(summary.planStatus, null);
});

test("paid Solo action uses destructive styling for an active downgrade", () => {
  assert.deepEqual(
    getSettingsSoloPlanAction({
      teamTier: "studio",
      subscriptionCancelAt: null,
    }),
    {
      label: "Cancel in Billing Portal",
      variant: "destructive",
    }
  );
});

test("paid Solo action keeps manage-cancellation styling non-destructive", () => {
  assert.deepEqual(
    getSettingsSoloPlanAction({
      teamTier: "studio",
      subscriptionCancelAt: "2026-04-15T00:00:00.000Z",
    }),
    {
      label: "Review Cancellation",
      variant: "outline",
    }
  );
});

test("getCheckoutConfirmationCopy explains recurring billing and legal review before Stripe checkout", () => {
  assert.deepEqual(
    getCheckoutConfirmationCopy("starter", "€29"),
    {
      title: "Continue to Starter checkout?",
      recurringNotice: "€29/mo. The subscription renews monthly until you cancel it.",
      cancellationNotice:
        "Cancellation, invoices, and plan changes are managed from the Stripe billing portal in your settings.",
      confirmLabel: "Continue to Stripe Checkout",
    },
  );
});

test("canContinueToCheckout requires both legal acknowledgements", () => {
  assert.equal(
    canContinueToCheckout({
      acceptedLegalDocuments: true,
      acknowledgedImmediateAccess: false,
    }),
    false,
  );

  assert.equal(
    canContinueToCheckout({
      acceptedLegalDocuments: true,
      acknowledgedImmediateAccess: true,
    }),
    true,
  );
});

test("resolveSettingsTab falls back to account for unknown values", () => {
  assert.equal(resolveSettingsTab("contact"), "contact");
  assert.equal(resolveSettingsTab("weird"), "account");
  assert.equal(resolveSettingsTab(null), "account");
});

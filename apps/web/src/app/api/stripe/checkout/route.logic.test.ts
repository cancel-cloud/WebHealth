import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCheckoutSessionParams,
  ensureStripeCustomerId,
} from "./route.logic";

test("ensureStripeCustomerId recreates and persists the customer when Stripe reports resource_missing", async () => {
  const persistedCustomerIds: string[] = [];
  const createdPayloads: unknown[] = [];
  const retrievedCustomerIds: string[] = [];

  const customerId = await ensureStripeCustomerId({
    currentCustomerId: "cus_missing",
    teamId: "team_123",
    userId: "user_123",
    email: "owner@example.com",
    name: "Owner",
    stripe: {
      customers: {
        retrieve: async (value: string) => {
          retrievedCustomerIds.push(value);
          throw {
            code: "resource_missing",
            type: "invalid_request_error",
            message: "No such customer: 'cus_missing'",
          };
        },
        create: async (payload) => {
          createdPayloads.push(payload);
          return { id: "cus_recreated" };
        },
      },
    },
    persistCustomerId: async (value: string) => {
      persistedCustomerIds.push(value);
    },
  });

  assert.equal(customerId, "cus_recreated");
  assert.deepEqual(retrievedCustomerIds, ["cus_missing"]);
  assert.deepEqual(persistedCustomerIds, ["cus_recreated"]);
  assert.deepEqual(createdPayloads, [
    {
      email: "owner@example.com",
      name: "Owner",
      metadata: {
        teamId: "team_123",
        userId: "user_123",
      },
    },
  ]);
});

test("buildCheckoutSessionParams includes recurring billing and legal review copy for hosted checkout", () => {
  const session = buildCheckoutSessionParams({
    customerId: "cus_123",
    priceId: "price_123",
    origin: "https://webhealth.devbrew.dev",
    teamId: "team_123",
    plan: "pro",
  });

  const submitMessage =
    typeof session.custom_text?.submit === "string"
      ? session.custom_text.submit
      : (session.custom_text?.submit?.message ?? "");
  const afterSubmitMessage =
    typeof session.custom_text?.after_submit === "string"
      ? session.custom_text.after_submit
      : (session.custom_text?.after_submit?.message ?? "");

  assert.equal(session.customer, "cus_123");
  assert.equal(session.mode, "subscription");
  assert.equal(session.success_url, "https://webhealth.devbrew.dev/settings?stripe=success");
  assert.equal(session.cancel_url, "https://webhealth.devbrew.dev/settings?stripe=cancelled");
  assert.equal(submitMessage.includes("renews monthly"), true);
  assert.equal(submitMessage.includes("https://webhealth.devbrew.dev/terms"), true);
  assert.equal(afterSubmitMessage.includes("billing portal"), true);
});

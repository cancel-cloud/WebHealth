import assert from "node:assert/strict";
import test from "node:test";

import { deleteUserAccount } from "./route.logic";

test("deleteUserAccount cancels owned subscriptions and clears blocking references before deleting the user", async () => {
  const steps: string[] = [];

  await deleteUserAccount("user_123", {
    listOwnedTeams: async () => [
      { id: "team_a", stripeSubscriptionId: "sub_a" },
      { id: "team_b", stripeSubscriptionId: null },
      { id: "team_c", stripeSubscriptionId: "sub_c" },
    ],
    cancelStripeSubscription: async (subscriptionId) => {
      steps.push(`cancel:${subscriptionId}`);
    },
    deleteSystemLogsForUser: async (userId) => {
      steps.push(`logs:${userId}`);
    },
    deleteUserFeatureFlagsForUser: async (userId) => {
      steps.push(`flags:${userId}`);
    },
    deleteMetricsBackfillJobsForUser: async (userId) => {
      steps.push(`jobs:${userId}`);
    },
    deleteOwnedTeams: async (userId) => {
      steps.push(`teams:${userId}`);
    },
    deleteUser: async (userId) => {
      steps.push(`user:${userId}`);
    },
  });

  assert.deepEqual(steps, [
    "cancel:sub_a",
    "cancel:sub_c",
    "logs:user_123",
    "flags:user_123",
    "jobs:user_123",
    "teams:user_123",
    "user:user_123",
  ]);
});

test("deleteUserAccount still deletes the account when Stripe cancellation fails", async () => {
  const steps: string[] = [];

  await deleteUserAccount("user_456", {
    listOwnedTeams: async () => [{ id: "team_a", stripeSubscriptionId: "sub_a" }],
    cancelStripeSubscription: async () => {
      steps.push("cancel:attempted");
      throw new Error("stripe unavailable");
    },
    deleteSystemLogsForUser: async () => {
      steps.push("logs:deleted");
    },
    deleteUserFeatureFlagsForUser: async () => {
      steps.push("flags:deleted");
    },
    deleteMetricsBackfillJobsForUser: async () => {
      steps.push("jobs:deleted");
    },
    deleteOwnedTeams: async () => {
      steps.push("teams:deleted");
    },
    deleteUser: async () => {
      steps.push("user:deleted");
    },
  });

  assert.deepEqual(steps, [
    "cancel:attempted",
    "logs:deleted",
    "flags:deleted",
    "jobs:deleted",
    "teams:deleted",
    "user:deleted",
  ]);
});

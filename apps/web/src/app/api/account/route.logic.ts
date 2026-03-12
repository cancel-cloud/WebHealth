type OwnedTeam = {
  id: string;
  stripeSubscriptionId: string | null;
};

export type DeleteUserAccountDeps = {
  listOwnedTeams: (userId: string) => Promise<OwnedTeam[]>;
  cancelStripeSubscription: (subscriptionId: string) => Promise<void>;
  deleteSystemLogsForUser: (userId: string) => Promise<void>;
  deleteUserFeatureFlagsForUser: (userId: string) => Promise<void>;
  deleteMetricsBackfillJobsForUser: (userId: string) => Promise<void>;
  deleteOwnedTeams: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
};

export async function deleteUserAccount(
  userId: string,
  deps: DeleteUserAccountDeps,
) {
  const ownedTeams = await deps.listOwnedTeams(userId);

  for (const team of ownedTeams) {
    if (!team.stripeSubscriptionId) continue;

    try {
      await deps.cancelStripeSubscription(team.stripeSubscriptionId);
    } catch {
      // Account deletion should not be blocked by Stripe cleanup failures.
    }
  }

  await deps.deleteSystemLogsForUser(userId);
  await deps.deleteUserFeatureFlagsForUser(userId);
  await deps.deleteMetricsBackfillJobsForUser(userId);
  await deps.deleteOwnedTeams(userId);
  await deps.deleteUser(userId);
}

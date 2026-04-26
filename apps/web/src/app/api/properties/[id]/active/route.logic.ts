export function buildPropertyActiveUpdate(input: {
  enabled: boolean;
  weeklyReviewEnabled: boolean;
  activePropertiesBefore: number;
  propertyWasActive?: boolean;
}) {
  const propertyWasActive = input.propertyWasActive ?? true;
  const delta = input.enabled === propertyWasActive ? 0 : input.enabled ? 1 : -1;

  return {
    nextActive: input.enabled,
    shouldDisableWeeklyReview: !input.enabled && input.weeklyReviewEnabled,
    activePropertiesAfter: Math.max(0, input.activePropertiesBefore + delta),
  };
}

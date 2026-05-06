export function shouldOpenOnboardingModal({
  onboardingCompletedAt,
}: {
  onboardingCompletedAt: Date | string | null | undefined;
}) {
  return onboardingCompletedAt == null;
}

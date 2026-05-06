export type OnboardingCompletionReason = "finished" | "skipped";

export function parseOnboardingCompletionReason(value: unknown): OnboardingCompletionReason {
  if (value === "finished" || value === "skipped") return value;
  throw new Error("Onboarding completion reason must be finished or skipped.");
}

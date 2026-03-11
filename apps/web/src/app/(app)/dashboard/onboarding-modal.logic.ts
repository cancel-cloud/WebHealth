export const ONBOARDING_WELCOMED_STORAGE_KEY = "webaudit_welcomed";

export function hasWelcomedFromStorage(value: string | null) {
  return value === "1";
}

export function shouldOpenOnboardingModal({
  hasProperties,
  hasWelcomed,
  dismissed,
}: {
  hasProperties: boolean;
  hasWelcomed: boolean;
  dismissed: boolean;
}) {
  return !hasProperties && !hasWelcomed && !dismissed;
}

export const SUPPORTED_LANGUAGES = ["de", "en"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type PreferredLanguageSource = "google" | "manual" | "default";

export const DEFAULT_SUPPORTED_LANGUAGE: SupportedLanguage = "de";

export const SUPPORTED_LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  de: "Deutsch",
  en: "English",
};

export function parseSupportedLanguage(value: unknown): SupportedLanguage | null {
  return value === "de" || value === "en" ? value : null;
}

export function normalizeSupportedLanguage(value: unknown): SupportedLanguage {
  if (typeof value !== "string") return DEFAULT_SUPPORTED_LANGUAGE;

  const normalized = value.trim().toLowerCase().replace("_", "-");
  if (normalized === "de" || normalized.startsWith("de-")) return "de";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";

  return DEFAULT_SUPPORTED_LANGUAGE;
}

export function getGoogleSeedLanguagePreference(
  currentPreferredLanguage: unknown,
  googleLocale: unknown,
): {
  preferredLanguage: SupportedLanguage;
  preferredLanguageSource: "google";
} | null {
  if (parseSupportedLanguage(currentPreferredLanguage)) return null;

  return {
    preferredLanguage: normalizeSupportedLanguage(googleLocale),
    preferredLanguageSource: "google",
  };
}

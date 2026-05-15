import { parseSupportedLanguage, type SupportedLanguage } from "@webhealth/shared/lib/language";

export type SettingsPatch = {
  weeklyDigest?: boolean;
  syncFailure?: boolean;
  emailReceipts?: boolean;
  preferredLanguage?: SupportedLanguage;
  preferredLanguageSource?: "manual";
};

const BOOLEAN_SETTINGS_FIELDS = ["weeklyDigest", "syncFailure", "emailReceipts"] as const;

export function normalizeSettingsPatch(body: Record<string, unknown>): {
  patch: SettingsPatch;
  hasChanges: boolean;
} {
  const patch: SettingsPatch = {};

  for (const field of BOOLEAN_SETTINGS_FIELDS) {
    if (typeof body[field] === "boolean") {
      patch[field] = body[field];
    }
  }

  const preferredLanguage = parseSupportedLanguage(body.preferredLanguage);
  if (preferredLanguage) {
    patch.preferredLanguage = preferredLanguage;
    patch.preferredLanguageSource = "manual";
  }

  return {
    patch,
    hasChanges: Object.keys(patch).length > 0,
  };
}

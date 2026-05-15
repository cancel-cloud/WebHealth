import { db } from "@webhealth/shared/db";
import { normalizeSupportedLanguage, type SupportedLanguage } from "@webhealth/shared/lib/language";

export async function getUserPreferredLanguage(userId: string): Promise<SupportedLanguage> {
  const settings = await db.query.userSettings.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
    columns: { preferredLanguage: true },
  });

  return normalizeSupportedLanguage(settings?.preferredLanguage);
}

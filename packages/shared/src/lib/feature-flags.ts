import { db } from "@webhealth/shared/db";

/**
 * Check if a feature flag is enabled for a given user.
 * Per-user override takes precedence over global enabledGlobally.
 * Returns true (enabled) if the flag doesn't exist in the DB.
 */
export async function isEnabled(flagName: string, userId: string): Promise<boolean> {
  const flag = await db.query.featureFlags.findFirst({
    where: (f, { eq }) => eq(f.name, flagName),
  });

  // If the flag doesn't exist, default to enabled
  if (!flag) return true;

  // Check for a user-level override
  const override = await db.query.userFeatureFlags.findFirst({
    where: (uff, { and, eq }) =>
      and(eq(uff.flagId, flag.id), eq(uff.userId, userId)),
  });

  if (override !== undefined) return override.enabled;

  // Fall back to global setting
  return flag.enabledGlobally;
}

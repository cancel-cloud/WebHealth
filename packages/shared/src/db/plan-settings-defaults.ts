import { count, eq } from "drizzle-orm";
import { planSettings } from "./schema";

export const PUBLISHED_PLAN_SETTING_TIERS = ["free", "starter", "studio", "agency"] as const;

export const DEFAULT_PLAN_SETTINGS = [
  {
    id: "plan_free",
    tier: "free",
    displayName: "Solo",
    maxProperties: 1,
  },
  {
    id: "plan_starter",
    tier: "starter",
    displayName: "Starter",
    maxProperties: 5,
  },
  {
    id: "plan_studio",
    tier: "studio",
    displayName: "Studio",
    maxProperties: 20,
  },
  {
    id: "plan_agency",
    tier: "agency",
    displayName: "Agency",
    maxProperties: 25,
  },
] as const;

type PlanSettingRow = {
  tier: string;
  displayName: string;
  maxProperties: number | null;
};

type DbLike = {
  select: (...args: unknown[]) => unknown;
  insert: (table: typeof planSettings) => unknown;
  update: (table: typeof planSettings) => unknown;
  delete: (table: typeof planSettings) => unknown;
};

export async function ensurePlanSettingsSeeded(db: DbLike) {
  const selectQuery = db.select({ count: count() }) as {
    from: (
      table: typeof planSettings,
    ) => Promise<Array<{ count: number | string | bigint }>>;
  };
  const existing = await selectQuery.from(planSettings);
  const rowCount = Number(existing[0]?.count ?? 0);

  const rowsQuery = db.select({
    tier: planSettings.tier,
    displayName: planSettings.displayName,
    maxProperties: planSettings.maxProperties,
  }) as {
    from: (table: typeof planSettings) => Promise<PlanSettingRow[]>;
  };
  const existingRows = await rowsQuery.from(planSettings);
  const existingByTier = new Map(existingRows.map((row) => [row.tier, row]));
  let changedCount = 0;

  changedCount += await deleteLegacyProPlanSetting(db, existingByTier);

  for (const tier of DEFAULT_PLAN_SETTINGS) {
    const existingTier = existingByTier.get(tier.tier);
    if (!existingTier) {
      const insertQuery = db.insert(planSettings) as {
        values: (value: (typeof DEFAULT_PLAN_SETTINGS)[number]) => {
          onConflictDoUpdate: (args: {
            target: typeof planSettings.tier;
            set: {
              displayName: string;
              maxProperties: number | null;
              updatedAt: Date;
            };
          }) => Promise<unknown>;
        };
      };
      await insertQuery
        .values(tier)
        .onConflictDoUpdate({
          target: planSettings.tier,
          set: {
            displayName: tier.displayName,
            maxProperties: tier.maxProperties,
            updatedAt: new Date(),
          },
        });
      changedCount += 1;
      continue;
    }

    if (shouldAlignLegacyPlanSetting(existingTier, tier)) {
      const updateQuery = db.update(planSettings) as {
        set: (value: {
          displayName: string;
          maxProperties: number | null;
          updatedAt: Date;
        }) => {
          where: (condition: unknown) => Promise<unknown>;
        };
      };
      await updateQuery
        .set({
          displayName: tier.displayName,
          maxProperties: tier.maxProperties,
          updatedAt: new Date(),
        })
        .where(eq(planSettings.tier, tier.tier));
      changedCount += 1;
    }
  }

  return {
    inserted: changedCount > 0,
    rowCount: rowCount + changedCount,
  };
}

function shouldAlignLegacyPlanSetting(
  existing: PlanSettingRow,
  defaults: (typeof DEFAULT_PLAN_SETTINGS)[number],
) {
  if (!isPublishedPlanTier(defaults.tier)) return false;

  if (existing.displayName === defaults.displayName && existing.maxProperties === defaults.maxProperties) {
    return false;
  }

  if (existing.displayName !== defaults.displayName) return true;
  return existing.maxProperties == null;
}

export function isPublishedPlanTier(tier: string): tier is (typeof PUBLISHED_PLAN_SETTING_TIERS)[number] {
  return PUBLISHED_PLAN_SETTING_TIERS.includes(tier as (typeof PUBLISHED_PLAN_SETTING_TIERS)[number]);
}

export function sortPublishedPlanSettings<T extends { tier: string }>(settings: T[]) {
  const byTier = new Map(settings.map((setting) => [setting.tier, setting]));
  return PUBLISHED_PLAN_SETTING_TIERS
    .map((tier) => byTier.get(tier))
    .filter((setting): setting is T => Boolean(setting));
}

async function deleteLegacyProPlanSetting(db: DbLike, existingByTier: Map<string, PlanSettingRow>) {
  if (!existingByTier.has("pro")) return 0;

  const deleteQuery = db.delete(planSettings) as {
    where: (condition: unknown) => Promise<unknown>;
  };
  await deleteQuery.where(eq(planSettings.tier, "pro"));
  return 1;
}

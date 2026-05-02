import { count } from "drizzle-orm";
import { planSettings } from "./schema";

export const DEFAULT_PLAN_SETTINGS = [
  {
    id: "plan_free",
    tier: "free",
    displayName: "Solo",
    maxProperties: null,
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
  {
    id: "plan_pro",
    tier: "pro",
    displayName: "Pro (legacy)",
    maxProperties: 20,
  },
] as const;

type DbLike = {
  select: (...args: unknown[]) => unknown;
  insert: (table: typeof planSettings) => unknown;
};

export async function ensurePlanSettingsSeeded(db: DbLike) {
  const selectQuery = db.select({ count: count() }) as {
    from: (
      table: typeof planSettings,
    ) => Promise<Array<{ count: number | string | bigint }>>;
  };
  const existing = await selectQuery.from(planSettings);
  const rowCount = Number(existing[0]?.count ?? 0);

  if (rowCount > 0) {
    return { inserted: false as const, rowCount };
  }

  for (const tier of DEFAULT_PLAN_SETTINGS) {
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
  }

  return { inserted: true as const, rowCount: DEFAULT_PLAN_SETTINGS.length };
}

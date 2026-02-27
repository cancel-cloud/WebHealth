import { count } from "drizzle-orm";
import { planSettings } from "./schema";

export const DEFAULT_PLAN_SETTINGS = [
  {
    id: "plan_free",
    tier: "free",
    displayName: "Free",
    reportsPerMonth: 5,
    maxProperties: 5,
  },
  {
    id: "plan_pro",
    tier: "pro",
    displayName: "Pro",
    reportsPerMonth: 50,
    maxProperties: null,
  },
  {
    id: "plan_team",
    tier: "team",
    displayName: "Team",
    reportsPerMonth: null,
    maxProperties: null,
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
            reportsPerMonth: number | null;
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
          reportsPerMonth: tier.reportsPerMonth,
          maxProperties: tier.maxProperties,
          updatedAt: new Date(),
        },
      });
  }

  return { inserted: true as const, rowCount: DEFAULT_PLAN_SETTINGS.length };
}

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { planSettings } from "./schema";

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient);

const tiers = [
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
];

async function seed() {
  console.log("Seeding plan settings...");
  for (const tier of tiers) {
    await db
      .insert(planSettings)
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
    console.log(`  ✓ ${tier.displayName}`);
  }
  console.log("Done.");
  await queryClient.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

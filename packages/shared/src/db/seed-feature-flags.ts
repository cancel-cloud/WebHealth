import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { featureFlags } from "./schema";
import { requireDirectDatabaseUrl } from "./url-guards";

config({ path: ".env.local" });
config();

const queryClient = postgres(requireDirectDatabaseUrl(), { max: 1 });
const db = drizzle(queryClient, { schema });

const FLAGS = [
  {
    id: "flag_crawling_enabled",
    name: "crawling_enabled",
    description: "Enable website crawling during property refreshes",
    enabledGlobally: true,
  },
];

async function seed() {
  console.log("Seeding feature flags...");
  for (const flag of FLAGS) {
    await db
      .insert(featureFlags)
      .values(flag)
      .onConflictDoNothing({ target: featureFlags.name });
    console.log(`  ✓ ${flag.name}`);
  }
  console.log("Done.");
  await queryClient.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

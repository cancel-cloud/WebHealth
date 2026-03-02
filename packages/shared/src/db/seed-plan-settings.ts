import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { ensurePlanSettingsSeeded } from "./plan-settings-defaults";
import { requireDirectDatabaseUrl } from "./url-guards";

config({ path: ".env.local" });
config();

const queryClient = postgres(requireDirectDatabaseUrl(), { max: 1 });
const db = drizzle(queryClient);

async function seed() {
  console.log("Ensuring default plan settings...");
  const result = await ensurePlanSettingsSeeded(db);
  if (result.inserted) {
    console.log(`  ✓ Inserted ${result.rowCount} default tiers (Free, Pro, Team)`);
  } else {
    console.log(`  ↷ Skipped (plan_settings already has ${result.rowCount} row(s))`);
  }
  console.log("Done.");
  await queryClient.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.local", override: true });

function requireDirectDatabaseUrl() {
  const url = process.env.DIRECT_DATABASE_URL;
  if (!url) {
    throw new Error("DB_CONFIG_ERROR: DIRECT_DATABASE_URL is required for migrations.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("DB_CONFIG_ERROR: DIRECT_DATABASE_URL is not a valid URL.");
  }

  const isLocalDatabase =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1" ||
    parsed.hostname === "::1";
  if (!isLocalDatabase && parsed.searchParams.get("sslmode") !== "require") {
    throw new Error("DB_CONFIG_ERROR: DIRECT_DATABASE_URL must include sslmode=require.");
  }

  return url;
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/shared/src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: requireDirectDatabaseUrl(),
  },
});

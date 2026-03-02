import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { validateDirectDatabaseUrl, validateRuntimeDatabaseUrl } from "./url-guards";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_MIGRATIONS_DIR = path.resolve(__dirname, "../../../../drizzle");
const DB_MIGRATION_LOCK_NAME = "webhealth_worker_db_migrations";

export type WorkerMigrationConfig = {
  migrationDatabaseUrl: string;
  migrationsFolder: string;
  derivedFromRuntime: boolean;
};

type ResolveWorkerMigrationConfigInput = {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  moduleDir?: string;
};

let ensureDatabaseReadyPromise: Promise<void> | null = null;

export function tryBuildDirectDatabaseUrlFromRuntime(runtimeUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(runtimeUrl);
  } catch {
    return null;
  }

  if (!parsed.hostname.includes("-pooler")) {
    return null;
  }

  parsed.hostname = parsed.hostname.replace("-pooler", "");
  return validateDirectDatabaseUrl(parsed.toString());
}

function resolveMigrationsFolder(input: ResolveWorkerMigrationConfigInput): string {
  const env = input.env ?? process.env;
  const cwd = input.cwd ?? process.cwd();
  const moduleDir = input.moduleDir ?? __dirname;

  const explicit = env.WORKER_DB_MIGRATIONS_DIR?.trim();
  if (explicit) {
    return path.isAbsolute(explicit) ? explicit : path.resolve(cwd, explicit);
  }

  if (moduleDir === __dirname) {
    return DEFAULT_MIGRATIONS_DIR;
  }

  return path.resolve(moduleDir, "../../../../drizzle");
}

export function resolveWorkerMigrationConfig(
  input: ResolveWorkerMigrationConfigInput = {},
): WorkerMigrationConfig {
  const env = input.env ?? process.env;
  const migrationsFolder = resolveMigrationsFolder(input);

  const directUrl = env.DIRECT_DATABASE_URL?.trim();
  if (directUrl) {
    return {
      migrationDatabaseUrl: validateDirectDatabaseUrl(directUrl),
      migrationsFolder,
      derivedFromRuntime: false,
    };
  }

  const runtimeUrl = env.DATABASE_URL?.trim();
  if (!runtimeUrl) {
    throw new Error(
      "DB_CONFIG_ERROR: Worker startup migrations require DIRECT_DATABASE_URL or DATABASE_URL.",
    );
  }

  const validatedRuntimeUrl = validateRuntimeDatabaseUrl(runtimeUrl);
  const derivedDirectUrl = tryBuildDirectDatabaseUrlFromRuntime(validatedRuntimeUrl);
  if (!derivedDirectUrl) {
    throw new Error(
      "DB_CONFIG_ERROR: Could not derive DIRECT_DATABASE_URL from DATABASE_URL. Set DIRECT_DATABASE_URL explicitly.",
    );
  }

  return {
    migrationDatabaseUrl: derivedDirectUrl,
    migrationsFolder,
    derivedFromRuntime: true,
  };
}

export async function ensureWorkerDatabaseReady() {
  if (!ensureDatabaseReadyPromise) {
    ensureDatabaseReadyPromise = runWorkerDatabaseMigrations();
  }

  return ensureDatabaseReadyPromise;
}

async function runWorkerDatabaseMigrations() {
  const config = resolveWorkerMigrationConfig();

  if (!existsSync(config.migrationsFolder)) {
    throw new Error(
      `DB_CONFIG_ERROR: Migration folder not found at ${config.migrationsFolder}. Set WORKER_DB_MIGRATIONS_DIR if needed.`,
    );
  }

  if (config.derivedFromRuntime) {
    console.warn(
      "[report-worker] DIRECT_DATABASE_URL not set; derived direct migration host from DATABASE_URL.",
    );
  }

  console.log(`[report-worker] ensuring DB schema via migrations in ${config.migrationsFolder}`);

  const migrationClient = postgres(config.migrationDatabaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  });
  const migrationDb = drizzle(migrationClient);

  try {
    await migrationClient`select pg_advisory_lock(hashtext(${DB_MIGRATION_LOCK_NAME}))`;

    await migrate(migrationDb, {
      migrationsFolder: config.migrationsFolder,
    });
  } finally {
    try {
      await migrationClient`select pg_advisory_unlock(hashtext(${DB_MIGRATION_LOCK_NAME}))`;
    } catch (unlockError) {
      console.warn("[report-worker] could not release DB migration advisory lock", unlockError);
    }

    await migrationClient.end({ timeout: 10 });
  }
}

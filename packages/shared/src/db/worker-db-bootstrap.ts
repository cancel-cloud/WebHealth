import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readMigrationFiles } from "drizzle-orm/migrator";
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

export function getPostgresErrorCode(error: unknown): string | null {
  const directCode =
    typeof (error as { code?: unknown })?.code === "string"
      ? ((error as { code: string }).code)
      : null;
  if (directCode) return directCode;

  const causeCode =
    typeof (error as { cause?: { code?: unknown } })?.cause?.code === "string"
      ? ((error as { cause: { code: string } }).cause.code)
      : null;
  return causeCode;
}

export function shouldAutoBaselineMigrations(error: unknown, migrationJournalCount: number) {
  return getPostgresErrorCode(error) === "42P07" && migrationJournalCount === 0;
}

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
    await ensureMigrationJournalObjects(migrationClient);

    let journalCount = await getMigrationJournalCount(migrationClient);
    try {
      await migrate(migrationDb, {
        migrationsFolder: config.migrationsFolder,
      });
    } catch (error) {
      if (!shouldAutoBaselineMigrations(error, journalCount)) {
        throw error;
      }

      const hasTables = await hasUserTables(migrationClient);
      if (!hasTables) {
        throw error;
      }

      console.warn(
        "[report-worker] detected existing schema with empty drizzle journal; baselining migrations and retrying.",
      );
      await baselineMigrationJournal(migrationClient, config.migrationsFolder);
      journalCount = await getMigrationJournalCount(migrationClient);
      if (journalCount === 0) {
        throw error;
      }

      await migrate(migrationDb, {
        migrationsFolder: config.migrationsFolder,
      });
    }
  } finally {
    try {
      await migrationClient`select pg_advisory_unlock(hashtext(${DB_MIGRATION_LOCK_NAME}))`;
    } catch (unlockError) {
      console.warn("[report-worker] could not release DB migration advisory lock", unlockError);
    }

    await migrationClient.end({ timeout: 10 });
  }
}

async function ensureMigrationJournalObjects(client: ReturnType<typeof postgres>) {
  await client`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await client`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;
}

async function getMigrationJournalCount(client: ReturnType<typeof postgres>) {
  const rows = await client`
    select count(*)::int as count
    from drizzle.__drizzle_migrations
  `;
  return Number(rows[0]?.count ?? 0);
}

async function hasUserTables(client: ReturnType<typeof postgres>) {
  const rows = await client`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
      limit 1
    ) as has_tables
  `;
  return Boolean(rows[0]?.has_tables);
}

async function baselineMigrationJournal(client: ReturnType<typeof postgres>, migrationsFolder: string) {
  const migrations = readMigrationFiles({ migrationsFolder });
  for (const migration of migrations) {
    await client`
      insert into drizzle.__drizzle_migrations (hash, created_at)
      select ${migration.hash}, ${migration.folderMillis}
      where not exists (
        select 1
        from drizzle.__drizzle_migrations
        where hash = ${migration.hash}
      )
    `;
  }
}

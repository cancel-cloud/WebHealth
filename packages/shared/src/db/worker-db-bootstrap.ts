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
const CRITICAL_TABLES = ["verification", "report_jobs"] as const;
const DRIFT_TOLERATED_ERROR_CODES = new Set(["42P07", "42710", "42P06", "42701"]);

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
  if (causeCode) return causeCode;

  const nestedCauseCode =
    typeof (error as { cause?: { cause?: { code?: unknown } } })?.cause?.cause?.code === "string"
      ? ((error as { cause: { cause: { code: string } } }).cause.cause.code)
      : null;
  if (nestedCauseCode) return nestedCauseCode;

  const message = error instanceof Error ? error.message : String(error ?? "");
  const causeMessage =
    typeof (error as { cause?: { message?: unknown } })?.cause?.message === "string"
      ? ((error as { cause: { message: string } }).cause.message)
      : "";
  const combined = `${message}\n${causeMessage}`;
  if (/42P07/.test(combined)) return "42P07";

  return null;
}

export function shouldAutoBaselineMigrations(error: unknown) {
  return isDriftToleratedErrorCode(getPostgresErrorCode(error));
}

export function isDriftToleratedErrorCode(code: string | null) {
  if (!code) return false;
  return DRIFT_TOLERATED_ERROR_CODES.has(code);
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
      const errorCode = getPostgresErrorCode(error);
      if (!shouldAutoBaselineMigrations(error)) {
        throw error;
      }

      console.warn(
        `[report-worker] migration failed with code ${errorCode ?? "unknown"} (journal rows: ${journalCount}); repairing drizzle journal and retrying.`,
      );
      await reconcileSchemaLeniently(migrationClient, config.migrationsFolder);
      await baselineMigrationJournal(migrationClient, config.migrationsFolder);
      journalCount = await getMigrationJournalCount(migrationClient);
      if (journalCount === 0) {
        throw error;
      }

      await migrate(migrationDb, {
        migrationsFolder: config.migrationsFolder,
      });
    }

    const missingCriticalTables = await getMissingCriticalTables(migrationClient);
    if (missingCriticalTables.length > 0) {
      console.warn(
        `[report-worker] missing critical tables after migration (${missingCriticalTables.join(", ")}); reconciling schema from migration SQL.`,
      );
      await reconcileSchemaLeniently(migrationClient, config.migrationsFolder);
      await baselineMigrationJournal(migrationClient, config.migrationsFolder);

      const stillMissing = await getMissingCriticalTables(migrationClient);
      if (stillMissing.length > 0) {
        throw new Error(
          `DB_SCHEMA_ERROR: Missing required tables after startup migration reconciliation: ${stillMissing.join(
            ", ",
          )}`,
        );
      }
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

async function baselineMigrationJournal(client: ReturnType<typeof postgres>, migrationsFolder: string) {
  const migrations = readMigrationFiles({ migrationsFolder });
  for (const migration of migrations) {
    await client`
      update drizzle.__drizzle_migrations
      set created_at = ${migration.folderMillis}
      where hash = ${migration.hash}
    `;
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

async function reconcileSchemaLeniently(client: ReturnType<typeof postgres>, migrationsFolder: string) {
  const migrations = readMigrationFiles({ migrationsFolder });
  for (const migration of migrations) {
    for (const rawStatement of migration.sql) {
      const statement = rawStatement.trim();
      if (!statement) continue;

      try {
        await client.unsafe(statement);
      } catch (error) {
        const code = getPostgresErrorCode(error);
        if (!isDriftToleratedErrorCode(code)) {
          throw error;
        }
      }
    }
  }
}

async function getMissingCriticalTables(client: ReturnType<typeof postgres>) {
  const missing: string[] = [];

  for (const tableName of CRITICAL_TABLES) {
    const rows = await client`
      select to_regclass(${`public.${tableName}`}) as regclass
    `;
    if (!rows[0]?.regclass) {
      missing.push(tableName);
    }
  }

  return missing;
}

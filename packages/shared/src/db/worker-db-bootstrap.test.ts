import assert from "node:assert/strict";
import test from "node:test";

import {
  getPostgresErrorCode,
  resolveWorkerMigrationConfig,
  shouldAutoBaselineMigrations,
  tryBuildDirectDatabaseUrlFromRuntime,
} from "./worker-db-bootstrap";

const pooledUrl =
  "postgresql://user:pass@ep-example-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const directUrl =
  "postgresql://user:pass@ep-example.eu-central-1.aws.neon.tech/neondb?sslmode=require";

test("prefers DIRECT_DATABASE_URL when provided", () => {
  const config = resolveWorkerMigrationConfig({
    env: { DIRECT_DATABASE_URL: directUrl, DATABASE_URL: pooledUrl },
    cwd: "/repo",
    moduleDir: "/repo/packages/shared/src/db",
  });

  assert.equal(config.migrationDatabaseUrl, directUrl);
  assert.equal(config.derivedFromRuntime, false);
  assert.equal(config.migrationsFolder, "/repo/drizzle");
});

test("derives direct host from pooled DATABASE_URL when DIRECT_DATABASE_URL is missing", () => {
  const config = resolveWorkerMigrationConfig({
    env: { DATABASE_URL: pooledUrl },
    cwd: "/repo",
    moduleDir: "/repo/packages/shared/src/db",
  });

  assert.equal(config.migrationDatabaseUrl, directUrl);
  assert.equal(config.derivedFromRuntime, true);
});

test("supports overriding migrations folder with WORKER_DB_MIGRATIONS_DIR", () => {
  const config = resolveWorkerMigrationConfig({
    env: { DATABASE_URL: pooledUrl, WORKER_DB_MIGRATIONS_DIR: "custom/drizzle" },
    cwd: "/repo",
    moduleDir: "/repo/packages/shared/src/db",
  });

  assert.equal(config.migrationsFolder, "/repo/custom/drizzle");
});

test("throws when neither DIRECT_DATABASE_URL nor DATABASE_URL is usable", () => {
  assert.throws(
    () =>
      resolveWorkerMigrationConfig({
        env: {},
        cwd: "/repo",
        moduleDir: "/repo/packages/shared/src/db",
      }),
    /DIRECT_DATABASE_URL or DATABASE_URL/,
  );
});

test("tryBuildDirectDatabaseUrlFromRuntime returns null when runtime host is not pooled", () => {
  const noPoolUrl =
    "postgresql://user:pass@ep-example.eu-central-1.aws.neon.tech/neondb?sslmode=require";

  assert.equal(tryBuildDirectDatabaseUrlFromRuntime(noPoolUrl), null);
});

test("getPostgresErrorCode extracts code from direct postgres error shape", () => {
  assert.equal(getPostgresErrorCode({ code: "42P07" }), "42P07");
});

test("getPostgresErrorCode extracts code from drizzle wrapped error shape", () => {
  assert.equal(getPostgresErrorCode({ cause: { code: "42P07" } }), "42P07");
});

test("getPostgresErrorCode extracts code from nested cause shape", () => {
  assert.equal(getPostgresErrorCode({ cause: { cause: { code: "42P07" } } }), "42P07");
});

test("getPostgresErrorCode falls back to parsing error message text", () => {
  assert.equal(
    getPostgresErrorCode(new Error("Failed query, PostgresError: relation already exists (42P07)")),
    "42P07",
  );
});

test("shouldAutoBaselineMigrations returns true for duplicate relation", () => {
  const should = shouldAutoBaselineMigrations({ cause: { code: "42P07" } });
  assert.equal(should, true);
});

test("shouldAutoBaselineMigrations returns false for non-duplicate migration errors", () => {
  const should = shouldAutoBaselineMigrations({ cause: { code: "42P01" } });
  assert.equal(should, false);
});

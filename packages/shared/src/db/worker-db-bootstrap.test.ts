import assert from "node:assert/strict";
import test from "node:test";

import {
  getPostgresErrorCode,
  isDriftToleratedErrorCode,
  resolveWorkerMigrationConfig,
  shouldAutoBaselineMigrations,
  tryBuildDirectDatabaseUrlFromRuntime,
} from "./worker-db-bootstrap";

const pooledUrl =
  "postgresql://user:pass@db-pooler.internal/webhealth?sslmode=require";
const directUrl =
  "postgresql://user:pass@db.internal/webhealth?sslmode=require";

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
    "postgresql://user:pass@db.internal/webhealth?sslmode=require";

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

test("shouldAutoBaselineMigrations returns true for duplicate-object drift", () => {
  const should = shouldAutoBaselineMigrations({ cause: { code: "42710" } });
  assert.equal(should, true);
});

test("shouldAutoBaselineMigrations returns false for non-duplicate migration errors", () => {
  const should = shouldAutoBaselineMigrations({ cause: { code: "42P01" } });
  assert.equal(should, false);
});

test("isDriftToleratedErrorCode accepts duplicate-object codes", () => {
  assert.equal(isDriftToleratedErrorCode("42P07"), true);
  assert.equal(isDriftToleratedErrorCode("42710"), true);
  assert.equal(isDriftToleratedErrorCode("42P06"), true);
});

test("isDriftToleratedErrorCode rejects non-duplicate codes", () => {
  assert.equal(isDriftToleratedErrorCode("42P01"), false);
  assert.equal(isDriftToleratedErrorCode(null), false);
});

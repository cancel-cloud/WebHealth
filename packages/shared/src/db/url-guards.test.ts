import assert from "node:assert/strict";
import test from "node:test";

import { validateDirectDatabaseUrl, validateRuntimeDatabaseUrl } from "./url-guards";

test("validateRuntimeDatabaseUrl accepts non-Neon pooled endpoints when sslmode is required", () => {
  const runtimeUrl = "postgresql://runtime:pass@db.webhealth.devbrew.dev:6432/webhealth?sslmode=require";

  assert.equal(validateRuntimeDatabaseUrl(runtimeUrl), runtimeUrl);
});

test("validateDirectDatabaseUrl accepts non-Neon direct endpoints when sslmode is required", () => {
  const directUrl = "postgresql://direct:pass@postgres.internal:5432/webhealth?sslmode=require";

  assert.equal(validateDirectDatabaseUrl(directUrl), directUrl);
});

test("database URL validators allow local Postgres without sslmode for development", () => {
  const runtimeUrl = "postgresql://postgres@localhost:5432/webhealth";
  const directUrl = "postgresql://postgres@127.0.0.1:5432/webhealth";

  assert.equal(validateRuntimeDatabaseUrl(runtimeUrl), runtimeUrl);
  assert.equal(validateDirectDatabaseUrl(directUrl), directUrl);
});

test("database URL validators still reject connections without sslmode=require", () => {
  const runtimeUrl = "postgresql://runtime:pass@db.webhealth.devbrew.dev:6432/webhealth";
  const directUrl = "postgresql://direct:pass@postgres.internal:5432/webhealth";

  assert.throws(() => validateRuntimeDatabaseUrl(runtimeUrl), /sslmode=require/);
  assert.throws(() => validateDirectDatabaseUrl(directUrl), /sslmode=require/);
});

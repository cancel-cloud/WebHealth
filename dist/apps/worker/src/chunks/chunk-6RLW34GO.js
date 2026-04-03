// ../../packages/shared/src/db/url-guards.ts
function parseDatabaseUrl(name, value) {
  try {
    return new URL(value);
  } catch {
    throw new Error(`DB_CONFIG_ERROR: ${name} is not a valid URL.`);
  }
}
function assertSslModeRequire(name, parsed) {
  if (parsed.searchParams.get("sslmode") !== "require") {
    throw new Error(`DB_CONFIG_ERROR: ${name} must include sslmode=require.`);
  }
}
function validateRuntimeDatabaseUrl(url) {
  const parsed = parseDatabaseUrl("DATABASE_URL", url);
  assertSslModeRequire("DATABASE_URL", parsed);
  return url;
}
function validateDirectDatabaseUrl(url) {
  const parsed = parseDatabaseUrl("DIRECT_DATABASE_URL", url);
  assertSslModeRequire("DIRECT_DATABASE_URL", parsed);
  return url;
}
function requireRuntimeDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DB_CONFIG_ERROR: DATABASE_URL is required.");
  }
  return validateRuntimeDatabaseUrl(value);
}
function requireDirectDatabaseUrl() {
  const value = process.env.DIRECT_DATABASE_URL;
  if (!value) {
    throw new Error("DB_CONFIG_ERROR: DIRECT_DATABASE_URL is required.");
  }
  return validateDirectDatabaseUrl(value);
}

export {
  validateRuntimeDatabaseUrl,
  validateDirectDatabaseUrl,
  requireRuntimeDatabaseUrl,
  requireDirectDatabaseUrl
};

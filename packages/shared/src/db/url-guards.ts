function parseDatabaseUrl(name: string, value: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error(`DB_CONFIG_ERROR: ${name} is not a valid URL.`);
  }
}

function assertSslModeRequire(name: string, parsed: URL) {
  if (isLocalDatabaseHost(parsed.hostname)) {
    return;
  }
  if (parsed.searchParams.get("sslmode") !== "require") {
    throw new Error(`DB_CONFIG_ERROR: ${name} must include sslmode=require.`);
  }
}

function isLocalDatabaseHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function validateRuntimeDatabaseUrl(url: string) {
  const parsed = parseDatabaseUrl("DATABASE_URL", url);
  assertSslModeRequire("DATABASE_URL", parsed);
  return url;
}

export function validateDirectDatabaseUrl(url: string) {
  const parsed = parseDatabaseUrl("DIRECT_DATABASE_URL", url);
  assertSslModeRequire("DIRECT_DATABASE_URL", parsed);
  return url;
}

export function requireRuntimeDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DB_CONFIG_ERROR: DATABASE_URL is required.");
  }
  return validateRuntimeDatabaseUrl(value);
}

export function requireDirectDatabaseUrl() {
  const value = process.env.DIRECT_DATABASE_URL;
  if (!value) {
    throw new Error("DB_CONFIG_ERROR: DIRECT_DATABASE_URL is required.");
  }
  return validateDirectDatabaseUrl(value);
}

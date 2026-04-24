import {
  schema_exports
} from "./chunk-GZVTNFTC.js";
import {
  requireRuntimeDatabaseUrl
} from "./chunk-AHMZJEDT.js";

// packages/shared/src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
var DATABASE_POOL_MAX = parseInt(process.env.DATABASE_POOL_MAX ?? "5", 10);
var DATABASE_POOL_IDLE_TIMEOUT = parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT ?? "20", 10);
var DATABASE_POOL_CONNECT_TIMEOUT = parseInt(process.env.DATABASE_POOL_CONNECT_TIMEOUT ?? "10", 10);
var queryClientSingleton = null;
function getQueryClient() {
  if (queryClientSingleton) return queryClientSingleton;
  const databaseUrl = requireRuntimeDatabaseUrl();
  queryClientSingleton = postgres(databaseUrl, {
    max: Number.isFinite(DATABASE_POOL_MAX) && DATABASE_POOL_MAX > 0 ? DATABASE_POOL_MAX : 5,
    idle_timeout: Number.isFinite(DATABASE_POOL_IDLE_TIMEOUT) && DATABASE_POOL_IDLE_TIMEOUT > 0 ? DATABASE_POOL_IDLE_TIMEOUT : 20,
    connect_timeout: Number.isFinite(DATABASE_POOL_CONNECT_TIMEOUT) && DATABASE_POOL_CONNECT_TIMEOUT > 0 ? DATABASE_POOL_CONNECT_TIMEOUT : 10
  });
  return queryClientSingleton;
}
var queryClient = getQueryClient();
var db = drizzle(queryClient, { schema: schema_exports });
async function closeDb() {
  if (!queryClientSingleton) return;
  await queryClientSingleton.end({ timeout: 5 });
  queryClientSingleton = null;
}

export {
  queryClient,
  db,
  closeDb
};

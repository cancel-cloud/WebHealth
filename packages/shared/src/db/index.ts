import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { requireRuntimeDatabaseUrl } from "./url-guards";

const DATABASE_POOL_MAX = parseInt(process.env.DATABASE_POOL_MAX ?? "5", 10);
const DATABASE_POOL_IDLE_TIMEOUT = parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT ?? "20", 10);
const DATABASE_POOL_CONNECT_TIMEOUT = parseInt(process.env.DATABASE_POOL_CONNECT_TIMEOUT ?? "10", 10);

let queryClientSingleton: ReturnType<typeof postgres> | null = null;

function getQueryClient() {
  if (queryClientSingleton) return queryClientSingleton;

  // Runtime connections must use the pooled endpoint with TLS enabled.
  const databaseUrl = requireRuntimeDatabaseUrl();

  queryClientSingleton = postgres(databaseUrl, {
    max: Number.isFinite(DATABASE_POOL_MAX) && DATABASE_POOL_MAX > 0 ? DATABASE_POOL_MAX : 5,
    idle_timeout:
      Number.isFinite(DATABASE_POOL_IDLE_TIMEOUT) && DATABASE_POOL_IDLE_TIMEOUT > 0
        ? DATABASE_POOL_IDLE_TIMEOUT
        : 20,
    connect_timeout:
      Number.isFinite(DATABASE_POOL_CONNECT_TIMEOUT) && DATABASE_POOL_CONNECT_TIMEOUT > 0
        ? DATABASE_POOL_CONNECT_TIMEOUT
        : 10,
  });

  return queryClientSingleton;
}

export const queryClient = getQueryClient();
export const db = drizzle(queryClient, { schema });

export async function closeDb() {
  if (!queryClientSingleton) return;
  await queryClientSingleton.end({ timeout: 5 });
  queryClientSingleton = null;
}

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { requireRuntimeDatabaseUrl } from "./url-guards";

const DATABASE_POOL_MAX = parseInt(process.env.DATABASE_POOL_MAX ?? "5", 10);
const DATABASE_POOL_IDLE_TIMEOUT = parseInt(process.env.DATABASE_POOL_IDLE_TIMEOUT ?? "20", 10);
const DATABASE_POOL_CONNECT_TIMEOUT = parseInt(process.env.DATABASE_POOL_CONNECT_TIMEOUT ?? "10", 10);

let queryClientSingleton: ReturnType<typeof postgres> | null = null;
let drizzleSingleton: ReturnType<typeof drizzle<typeof schema>> | null = null;

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

function getDb() {
  if (drizzleSingleton) return drizzleSingleton;
  drizzleSingleton = drizzle(getQueryClient(), { schema });
  return drizzleSingleton;
}

/**
 * Lazy Proxy: defers `requireRuntimeDatabaseUrl()` and Drizzle init until
 * first property access. Allows files that import `db` to be loaded by tests
 * without `DATABASE_URL` being set, as long as the test paths don't touch `db`.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const real = getDb();
    return Reflect.get(real as object, prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(getDb() as object, prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getDb() as object);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getDb() as object, prop);
  },
});

/**
 * Lazy accessor for the raw postgres client. Importers that previously
 * relied on `queryClient` as a value will trigger init on first use.
 */
export const queryClient = new Proxy({} as ReturnType<typeof postgres>, {
  get(_target, prop, receiver) {
    return Reflect.get(getQueryClient() as object, prop, receiver);
  },
  apply(_target, thisArg, argArray) {
    const client = getQueryClient() as unknown as (...args: unknown[]) => unknown;
    return Reflect.apply(client, thisArg, argArray);
  },
  has(_target, prop) {
    return Reflect.has(getQueryClient() as object, prop);
  },
}) as ReturnType<typeof postgres>;

export async function closeDb() {
  if (!queryClientSingleton) return;
  await queryClientSingleton.end({ timeout: 5 });
  queryClientSingleton = null;
  drizzleSingleton = null;
}

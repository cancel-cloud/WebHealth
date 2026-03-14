type CacheEntry<T> = { value: T; expiresAt: number };

export function withCache<T>(fn: () => Promise<T>, ttlMs: number): () => Promise<T> {
  let entry: CacheEntry<T> | null = null;
  let inflight: Promise<T> | null = null;

  return async () => {
    const now = Date.now();
    if (entry && entry.expiresAt > now) return entry.value;
    if (inflight) return inflight;

    inflight = fn().then((value) => {
      entry = { value, expiresAt: Date.now() + ttlMs };
      inflight = null;
      return value;
    });
    return inflight;
  };
}

export function withKeyedCache<K extends string, T>(
  fn: (key: K) => Promise<T>,
  ttlMs: number
): (key: K) => Promise<T> {
  const cache = new Map<K, CacheEntry<T>>();
  const inflight = new Map<K, Promise<T>>();

  return async (key: K) => {
    const now = Date.now();
    const entry = cache.get(key);
    if (entry && entry.expiresAt > now) return entry.value;
    const pending = inflight.get(key);
    if (pending) return pending;

    const promise = fn(key).then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      inflight.delete(key);
      return value;
    });
    inflight.set(key, promise);
    return promise;
  };
}

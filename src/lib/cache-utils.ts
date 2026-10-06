type CacheEntry = { promise: Promise<unknown>; expiresAt: number };
const cache = new Map<string, CacheEntry>();

/** Share in-flight work; TTL starts on completion, not when loading begins. */
export async function withCache<T>(
  key: string,
  load: () => Promise<T>,
  ttl = 5 * 60 * 1000,
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    // Callers of one cache key must use one value type.
    return cached.promise as Promise<T>;
  }
  const entry: CacheEntry = {
    promise: Promise.resolve().then(load),
    expiresAt: Infinity,
  };
  cache.set(key, entry);
  try {
    const result = await entry.promise;
    entry.expiresAt = Date.now() + ttl;
    return result as T;
  } catch (error) {
    // An invalidated/replaced request must not evict a newer entry.
    if (cache.get(key) === entry) cache.delete(key);
    throw error;
  }
}

export function clearCache(key: string): void {
  cache.delete(key);
}

export function clearAllCache(): void {
  cache.clear();
}

export function getCacheStats() {
  return { size: cache.size, keys: Array.from(cache.keys()) };
}

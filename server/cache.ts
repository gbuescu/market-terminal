/**
 * SQLite-backed TTL cache with in-flight deduplication and stale-serve:
 * if a refresh fails and an expired entry exists, the expired entry is
 * returned with stale=true instead of erroring. All provider access goes
 * through this so the UI's freshness indicators work uniformly.
 */
import { db } from './db.ts';

export interface CacheHit<T> {
  data: T;
  fetchedAt: number;
  fromCache: boolean;
  stale: boolean;
}

const inflight = new Map<string, Promise<CacheHit<unknown>>>();

export async function getOrFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<CacheHit<T>> {
  const row = db.prepare('SELECT value, fetched_at FROM cache WHERE key = ?').get(key) as
    | { value: string; fetched_at: number }
    | undefined;
  const now = Date.now();
  if (row && now - row.fetched_at < ttlMs) {
    return {
      data: JSON.parse(row.value) as T,
      fetchedAt: row.fetched_at,
      fromCache: true,
      stale: false,
    };
  }

  const pending = inflight.get(key);
  if (pending) return pending as Promise<CacheHit<T>>;

  const p = (async (): Promise<CacheHit<T>> => {
    try {
      const data = await fetcher();
      db.prepare(
        `INSERT INTO cache (key, value, fetched_at, ttl_ms) VALUES (?, ?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, fetched_at = excluded.fetched_at, ttl_ms = excluded.ttl_ms`,
      ).run(key, JSON.stringify(data), now, ttlMs);
      return { data, fetchedAt: now, fromCache: false, stale: false };
    } catch (err) {
      if (row) {
        // Refresh failed — serve the expired entry, honestly flagged.
        return {
          data: JSON.parse(row.value) as T,
          fetchedAt: row.fetched_at,
          fromCache: true,
          stale: true,
        };
      }
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p as Promise<CacheHit<unknown>>);
  return p;
}

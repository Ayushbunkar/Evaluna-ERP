import type { Role, Permission } from "./permissions";

/**
 * Cached session payload that avoids hitting the DB
 * on every TRPC/Server Component request if not necessary.
 */
export interface CachedSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
  branchId: number | null;
  isSuperadmin: boolean;
  isActive: boolean;
  permissions: Permission[];
  expiresAt: Date;
}

// Simple in-memory cache implementation to avoid external 'lru-cache' dependency
class SimpleCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  private max: number;
  private ttl: number;

  constructor(options: { max: number; ttl: number }) {
    this.max = options.max;
    this.ttl = options.ttl;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.size >= this.max) {
      // Evict first key (oldest inserted)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  delete(key: K): void {
    this.cache.delete(key);
  }
}

// Global cache in server memory
// Caches session data by the Better Auth session token.
export const sessionCache = new SimpleCache<string, CachedSession>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

export function getCachedSession(token: string): CachedSession | undefined {
  return sessionCache.get(token);
}

export function setCachedSession(token: string, session: CachedSession): void {
  sessionCache.set(token, session);
}

export function invalidateCachedSession(token: string): void {
  sessionCache.delete(token);
}

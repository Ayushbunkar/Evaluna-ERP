import { LRUCache } from "lru-cache";
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

// Global LRU cache in server memory
// Caches session data by the Better Auth session token.
export const sessionCache = new LRUCache<string, CachedSession>({
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

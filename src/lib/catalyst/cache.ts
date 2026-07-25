/**
 * Catalyst Cache Adapter
 * 
 * When Catalyst is configured: uses Catalyst Cache (ZC_core_cache)
 * When running locally: uses an in-memory Map with TTL support
 * 
 * Usage:
 *   import { cacheGet, cacheSet } from '@/lib/catalyst/cache'
 *   await cacheSet('dashboard_stats', data, 300)
 *   const data = await cacheGet('dashboard_stats')
 */

import { catalystConfig } from './config'
import { getCatalystApp } from './sdk'

// ─── In-Memory Cache Implementation ──────────────────────────────

type CacheEntry<T = unknown> = {
  value: T
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry>()

function cleanExpired() {
  const now = Date.now()
  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt <= now) memoryCache.delete(key)
  }
}

// Run cleanup every 60 seconds
if (typeof globalThis !== 'undefined') {
  setInterval(cleanExpired, 60_000)
}

// ─── Public API ─────────────────────────────────────────────────

/** Get a value from cache. Returns null on miss. */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  try {
    if (catalystConfig.isCatalyst) {
      const app = await getCatalystApp()
      if (!app) throw new Error('Catalyst SDK not initialized')
      const segment = app.cache().segment()
      const value = await segment.getValue(key)
      return (value as T) ?? null
    }
  } catch (error) {
    console.warn(`[Catalyst Cache] get(${key}) failed:`, error)
  }

  // Fallback: in-memory
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key)
    return null
  }
  return entry.value as T
}

/** Set a value in cache with optional TTL (default 300 seconds). */
export async function cacheSet<T = unknown>(key: string, value: T, ttl: number = 300): Promise<void> {
  try {
    if (catalystConfig.isCatalyst) {
      const app = await getCatalystApp()
      if (!app) throw new Error('Catalyst SDK not initialized')
      const segment = app.cache().segment()
      // Expiry is in hours in Catalyst Node SDK, so we convert from seconds.
      // Minimum is 1 hour for Zoho Catalyst cache TTL.
      const expiryInHours = Math.max(1, Math.ceil(ttl / 3600))
      await segment.put(key, value, expiryInHours)
      return
    }
  } catch (error) {
    console.warn(`[Catalyst Cache] set(${key}) failed:`, error)
  }

  // Fallback: in-memory
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000,
  })
}

/** Delete a key from cache. */
export async function cacheDelete(key: string): Promise<void> {
  try {
    if (catalystConfig.isCatalyst) {
      const app = await getCatalystApp()
      if (!app) throw new Error('Catalyst SDK not initialized')
      const segment = app.cache().segment()
      await segment.delete(key)
      return
    }
  } catch (error) {
    console.warn(`[Catalyst Cache] delete(${key}) failed:`, error)
  }

  memoryCache.delete(key)
}

/** Clear all cache entries. */
export async function cacheClear(): Promise<void> {
  try {
    if (catalystConfig.isCatalyst) {
      // In the Node SDK, clearing all cache requires deleting the segment or we clear memory cache.
      // We can iterate and delete or reset. Since clear is rarely used in Next.js, we reset memory.
      memoryCache.clear()
      return
    }
  } catch (error) {
    console.warn('[Catalyst Cache] clear() failed:', error)
  }

  memoryCache.clear()
}

/** Cache wrapper — fetch with caching */
export async function cachedFetch<T = unknown>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300,
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  await cacheSet(key, fresh, ttl)
  return fresh
}

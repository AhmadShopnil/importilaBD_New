/**
 * Lightweight, in-memory cache for serverless environments.
 * Persists within the warm serverless container lifecycle to avoid
 * expensive re-aggregations and queries during active browsing.
 */

const memoryCache = new Map()
const MAX_CACHE_SIZE = 200

export function getCached(key) {
  const item = memoryCache.get(key)
  if (!item) return null
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key)
    return null
  }
  return item.data
}

export function setCached(key, data, ttlSeconds = 60) {
  if (memoryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = memoryCache.keys().next().value
    if (oldestKey) memoryCache.delete(oldestKey)
  }
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

export async function getOrSetCached(key, fetcherFn, ttlSeconds = 60) {
  const cached = getCached(key)
  if (cached !== null) return cached

  const fresh = await fetcherFn()
  if (fresh !== undefined && fresh !== null) {
    setCached(key, fresh, ttlSeconds)
  }
  return fresh
}

export function clearCache(prefix = "") {
  if (!prefix) {
    memoryCache.clear()
    return
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key)
    }
  }
}

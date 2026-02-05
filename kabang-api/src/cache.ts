// Cache implementation
const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry<T> {
  data: T
  cachedAt: number
}

export class BangCache {
  private cache = new Map<string, CacheEntry<string>>()
  private defaultEntry: CacheEntry<string | null> | null = null

  get(bang: string): string | null {
    const entry = this.cache.get(bang)
    if (!entry) return null
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      this.cache.delete(bang)
      return null
    }
    return entry.data
  }

  getDefault(): string | null {
    if (!this.defaultEntry) return null
    if (Date.now() - this.defaultEntry.cachedAt > CACHE_TTL_MS) {
      this.defaultEntry = null
      return null
    }
    return this.defaultEntry.data
  }

  set(bang: string, url: string): void {
    this.cache.set(bang, { data: url, cachedAt: Date.now() })
  }

  setDefault(url: string | null): void {
    this.defaultEntry = { data: url, cachedAt: Date.now() }
  }

  clear(): void {
    this.cache.clear()
    this.defaultEntry = null
  }

  size(): number {
    return this.cache.size
  }
}

export const bangCache = new BangCache()

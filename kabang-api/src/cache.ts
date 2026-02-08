// Cache implementation
const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry<T> {
  data: T
  cachedAt: number
}

interface BangInfo {
  bang: string
  url: string
  name: string
  category: string | null
}

export class BangCache {
  private cache = new Map<string, CacheEntry<BangInfo>>()
  private defaultEntry: CacheEntry<string | null> | null = null

  get(bang: string): string | null {
    const entry = this.cache.get(bang)
    if (!entry) return null
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      this.cache.delete(bang)
      return null
    }
    return entry.data.url
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
    const existing = this.cache.get(bang)
    this.cache.set(bang, { 
      data: { 
        bang, 
        url, 
        name: existing?.data.name || bang,
        category: existing?.data.category || null
      }, 
      cachedAt: Date.now() 
    })
  }

  setFull(bang: BangInfo): void {
    this.cache.set(bang.bang, { data: bang, cachedAt: Date.now() })
  }

  setDefault(url: string | null): void {
    this.defaultEntry = { data: url, cachedAt: Date.now() }
  }

  getAllBangs(): BangInfo[] {
    const now = Date.now()
    const bangs: BangInfo[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.cachedAt > CACHE_TTL_MS) {
        this.cache.delete(key)
      } else {
        bangs.push(entry.data)
      }
    }
    
    return bangs
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

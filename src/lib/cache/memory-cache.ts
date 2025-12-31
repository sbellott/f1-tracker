interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: Date;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Get a cached value
   */
  get<T>(key: string): { data: T; createdAt: Date } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return { data: entry.data, createdAt: entry.createdAt };
  }

  /**
   * Set a cached value with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: new Date(),
    });
  }

  /**
   * Delete a cached value
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all entries matching a prefix
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get or set cached value
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<{ data: T; cached: boolean; createdAt: Date }> {
    const cached = this.get<T>(key);
    if (cached) {
      return { data: cached.data, cached: true, createdAt: cached.createdAt };
    }

    const data = await fetcher();
    this.set(key, data, ttlSeconds);

    return { data, cached: false, createdAt: new Date() };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy the cache instance
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
const globalForCache = globalThis as unknown as {
  memoryCache: MemoryCache | undefined;
};

export const cache =
  globalForCache.memoryCache ?? new MemoryCache();

if (process.env.NODE_ENV !== "production") {
  globalForCache.memoryCache = cache;
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  STANDINGS: 60 * 60, // 1 hour
  CALENDAR: 24 * 60 * 60, // 24 hours
  DRIVERS: 24 * 60 * 60, // 24 hours
  CONSTRUCTORS: 24 * 60 * 60, // 24 hours
  CIRCUITS: 7 * 24 * 60 * 60, // 7 days
  RESULTS: 365 * 24 * 60 * 60, // 1 year (essentially permanent)
} as const;

export default cache;

/**
 * Represents a cache key used in the FetchClientCache.
 */
export type CacheKey = string[] | string;

/**
 * Represents an entry in the FetchClientCache.
 */
type CacheEntry = {
  key: CacheKey;
  lastAccess: Date;
  expires: Date;
  response: Response;
};

/**
 * Represents a cache for storing responses from the FetchClient.
 */
export class FetchClientCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Sets a response in the cache with the specified key.
   * @param key - The cache key.
   * @param response - The response to be cached.
   * @param cacheDuration - The duration for which the response should be cached (in milliseconds).
   */
  public set(key: CacheKey, response: Response, cacheDuration?: number): void {
    this.cache.set(this.getHash(key), {
      key,
      lastAccess: new Date(),
      expires: new Date(Date.now() + (cacheDuration ?? 60000)),
      response,
    });
  }

  /**
   * Retrieves a response from the cache with the specified key.
   * @param key - The cache key.
   * @returns The cached response, or null if the response is not found or has expired.
   */
  public get(key: CacheKey): Response | null {
    const cacheEntry = this.cache.get(this.getHash(key));

    if (!cacheEntry) {
      return null;
    }

    if (cacheEntry.expires < new Date()) {
      this.cache.delete(this.getHash(key));
      return null;
    }

    cacheEntry.lastAccess = new Date();
    return cacheEntry.response;
  }

  /**
   * Deletes a response from the cache with the specified key.
   * @param key - The cache key.
   * @returns True if the response was successfully deleted, false otherwise.
   */
  public delete(key: CacheKey): boolean {
    return this.cache.delete(this.getHash(key));
  }

  /**
   * Deletes all responses from the cache that have keys beginning with the specified key.
   * @param prefix - The cache key prefix.
   * @returns The number of responses that were deleted.
   */
  public deleteAll(prefix: CacheKey): number {
    let count = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(this.getHash(prefix))) {
        if (this.cache.delete(key)) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Checks if a response exists in the cache with the specified key.
   * @param key - The cache key.
   * @returns True if the response exists in the cache, false otherwise.
   */
  public has(key: CacheKey): boolean {
    return this.cache.has(this.getHash(key));
  }

  /**
   * Returns an iterator for the cache entries.
   * @returns An iterator for the cache entries.
   */
  public values(): IterableIterator<CacheEntry> {
    return this.cache.values();
  }

  /**
   * Clears all entries from the cache.
   */
  public clear(): void {
    this.cache.clear();
  }

  private getHash(key: CacheKey): string {
    if (key instanceof Array) {
      return key.join(":");
    }

    return key;
  }
}

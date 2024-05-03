export type CacheKey = string[];
type CacheEntry = {
  key: CacheKey;
  lastAccess: Date;
  expires: Date;
  response: Response;
};

export class FetchClientCache {
  private cache = new Map<string, CacheEntry>();

  public set(key: CacheKey, response: Response, cacheDuration?: number): void {
    this.cache.set(this.getHash(key), {
      key,
      lastAccess: new Date(),
      expires: new Date(Date.now() + (cacheDuration ?? 60000)),
      response,
    });
  }

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

  public delete(key: CacheKey): boolean {
    return this.cache.delete(this.getHash(key));
  }

  public has(key: CacheKey): boolean {
    return this.cache.has(this.getHash(key));
  }

  public values(): IterableIterator<CacheEntry> {
    return this.cache.values();
  }

  public clear(): void {
    this.cache.clear();
  }

  private getHash(key: CacheKey): string {
    return key.join(":");
  }
}

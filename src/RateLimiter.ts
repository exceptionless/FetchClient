/**
 * Configuration options for the rate limiter.
 */
export interface RateLimiterOptions {
  /**
   * Maximum number of requests allowed per time window.
   */
  maxRequests: number;

  /**
   * Time window in milliseconds.
   */
  windowMs: number;

  /**
   * Optional key generator function to create unique rate limit buckets.
   * If not provided, a global rate limit is applied.
   * @param url - The request URL
   * @param method - The HTTP method
   * @returns A string key to identify the rate limit bucket
   */
  keyGenerator?: (url: string, method: string) => string;

  /**
   * Callback function called when rate limit is exceeded.
   * @param resetTime - Time when the rate limit will reset (in milliseconds since epoch)
   */
  onRateLimitExceeded?: (resetTime: number) => void;
}

/**
 * Represents a rate limit bucket with request tracking.
 */
interface RateLimitBucket {
  requests: number[];
  resetTime: number;
}

/**
 * A rate limiter that tracks requests per time window.
 */
export class RateLimiter {
  private readonly options: Required<RateLimiterOptions>;
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(options: RateLimiterOptions) {
    this.options = {
      keyGenerator: () => "global",
      onRateLimitExceeded: () => {},
      ...options,
    };
  }

  /**
   * Checks if a request is allowed and updates the rate limit state.
   * @param url - The request URL
   * @param method - The HTTP method
   * @returns True if the request is allowed, false if rate limit is exceeded
   */
  public isAllowed(url: string, method: string): boolean {
    const key = this.options.keyGenerator(url, method);
    const now = Date.now();

    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = {
        requests: [],
        resetTime: now + this.options.windowMs,
      };
      this.buckets.set(key, bucket);
    }

    // Clean up old requests outside the time window
    const windowStart = now - this.options.windowMs;
    bucket.requests = bucket.requests.filter((time) => time > windowStart);

    // Update reset time if all requests have expired
    if (bucket.requests.length === 0) {
      bucket.resetTime = now + this.options.windowMs;
    }

    // Check if we're within the rate limit
    if (bucket.requests.length >= this.options.maxRequests) {
      this.options.onRateLimitExceeded(bucket.resetTime);
      return false;
    }

    // Add the current request
    bucket.requests.push(now);
    return true;
  }

  /**
   * Gets the current request count for a specific key.
   * @param url - The request URL
   * @param method - The HTTP method
   * @returns The current number of requests in the time window
   */
  public getRequestCount(url: string, method: string): number {
    const key = this.options.keyGenerator(url, method);
    const bucket = this.buckets.get(key);

    if (!bucket) {
      return 0;
    }

    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    return bucket.requests.filter((time) => time > windowStart).length;
  }

  /**
   * Gets the remaining requests allowed for a specific key.
   * @param url - The request URL
   * @param method - The HTTP method
   * @returns The number of remaining requests allowed
   */
  public getRemainingRequests(url: string, method: string): number {
    return Math.max(
      0,
      this.options.maxRequests - this.getRequestCount(url, method),
    );
  }

  /**
   * Gets the time when the rate limit will reset for a specific key.
   * @param url - The request URL
   * @param method - The HTTP method
   * @returns The reset time in milliseconds since epoch, or null if no bucket exists
   */
  public getResetTime(url: string, method: string): number | null {
    const key = this.options.keyGenerator(url, method);
    const bucket = this.buckets.get(key);
    return bucket?.resetTime ?? null;
  }

  /**
   * Clears the rate limit state for a specific key.
   * @param url - The request URL
   * @param method - The HTTP method
   */
  public clearBucket(url: string, method: string): void {
    const key = this.options.keyGenerator(url, method);
    this.buckets.delete(key);
  }

  /**
   * Clears all rate limit state.
   */
  public clearAll(): void {
    this.buckets.clear();
  }
}

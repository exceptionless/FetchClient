import type { FetchClientContext } from "./FetchClientContext.ts";
import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import type { FetchClientResponse } from "./FetchClientResponse.ts";
import { ProblemDetails } from "./ProblemDetails.ts";

const RATE_LIMITER_CONTEXT_KEY = "__rateLimiter__";

/**
 * Creates a rate limiting middleware that controls the rate of requests.
 * @param rateLimiter - The rate limiter instance to use.
 * @returns A middleware function that enforces rate limiting.
 */
export function createRateLimitMiddleware(
  rateLimiter: RateLimiter,
): FetchClientMiddleware {
  return async (context: FetchClientContext, next: () => Promise<void>) => {
    // Store the rate limiter in context for potential access by other middleware
    context[RATE_LIMITER_CONTEXT_KEY] = rateLimiter;

    // Try to record the request - returns false if rate limit is exceeded
    const canProceed = rateLimiter.recordRequest();

    if (!canProceed) {
      // Rate limit exceeded - create a 429 response
      const problem = new ProblemDetails();
      problem.type = "https://tools.ietf.org/html/rfc6585#section-4";
      problem.title = "Too Many Requests";
      problem.status = 429;
      problem.detail =
        `Rate limit exceeded: ${rateLimiter.configuration.maxRequests} requests per ${rateLimiter.configuration.windowMs}ms`;
      problem.instance = context.request.url;

      const headers = new Headers();
      headers.set("Content-Type", "application/problem+json");
      headers.set(
        "Retry-After",
        Math.ceil(rateLimiter.getTimeUntilNextRequest() / 1000).toString(),
      );

      context.response = {
        url: context.request.url,
        status: 429,
        statusText: "Too Many Requests",
        body: null,
        bodyUsed: true,
        ok: false,
        headers: headers,
        redirected: false,
        problem: problem,
        data: null,
        meta: { links: {} },
        type: "basic",
        json: () => Promise.resolve(problem),
        text: () => Promise.resolve(JSON.stringify(problem)),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        // @ts-ignore: New in Deno 1.44
        bytes: () => Promise.resolve(new Uint8Array()),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        clone: () => {
          throw new Error("Not implemented");
        },
      } as FetchClientResponse<unknown>;
    } else {
      // Rate limit not exceeded - continue with the request
      await next();
    }
  };
}

/**
 * Gets the rate limiter from the context if available.
 * @param context - The fetch client context.
 * @returns The rate limiter instance or null if not available.
 */
export function getRateLimiterFromContext(
  context: FetchClientContext,
): RateLimiter | null {
  return (context[RATE_LIMITER_CONTEXT_KEY] as RateLimiter) || null;
}

/**
 * Configuration options for rate limiting.
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed per time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Represents a rate limiter that controls the rate of requests.
 */
export class RateLimiter {
  private readonly timestamps: number[];
  private head = 0;
  private count = 0;
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.timestamps = new Array(config.maxRequests);
  }

  /**
   * Gets the current rate limit configuration.
   */
  public get configuration(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Checks if a request can be made without exceeding the rate limit.
   * @returns true if the request can be made, false otherwise.
   */
  public canMakeRequest(): boolean {
    this.cleanup();
    return this.count < this.config.maxRequests;
  }

  /**
   * Records a request if within rate limits.
   * @returns true if the request was recorded, false if rate limit exceeded.
   */
  public recordRequest(): boolean {
    this.cleanup();

    if (this.count >= this.config.maxRequests) {
      return false;
    }

    const now = Date.now();
    const index = (this.head + this.count) % this.config.maxRequests;
    this.timestamps[index] = now;
    this.count++;

    return true;
  }

  /**
   * Gets the number of requests made in the current time window.
   */
  public getCurrentRequestCount(): number {
    this.cleanup();
    return this.count;
  }

  /**
   * Gets the remaining number of requests that can be made in the current time window.
   */
  public getRemainingRequests(): number {
    return Math.max(0, this.config.maxRequests - this.getCurrentRequestCount());
  }

  /**
   * Gets the time until the next request can be made (in milliseconds).
   */
  public getTimeUntilNextRequest(): number {
    this.cleanup();

    if (this.count < this.config.maxRequests) {
      return 0;
    }

    const oldestRequest = this.timestamps[this.head];
    const timeUntilExpiry = (oldestRequest + this.config.windowMs) - Date.now();
    return Math.max(0, timeUntilExpiry);
  }

  /**
   * Resets the rate limiter state.
   */
  public reset(): void {
    this.head = 0;
    this.count = 0;
  }

  private cleanup(): void {
    if (this.count === 0) return;

    const now = Date.now();
    const cutoff = now - this.config.windowMs;

    // Remove expired requests from the front of the circular buffer
    while (this.count > 0 && this.timestamps[this.head] <= cutoff) {
      this.head = (this.head + 1) % this.config.maxRequests;
      this.count--;
    }
  }
}

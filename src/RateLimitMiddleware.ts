import type { FetchClientContext } from "./FetchClientContext.ts";
import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import type { FetchClientResponse } from "./FetchClientResponse.ts";
import { ProblemDetails } from "./ProblemDetails.ts";
import { RateLimiter, type RateLimiterOptions } from "./RateLimiter.ts";

/**
 * Rate limiting error thrown when requests exceed the rate limit.
 */
export class RateLimitError extends Error {
  public readonly resetTime: number;
  public readonly remainingRequests: number;

  constructor(resetTime: number, remainingRequests: number, message?: string) {
    super(
      message ||
        `Rate limit exceeded. Try again after ${
          new Date(resetTime).toISOString()
        }`,
    );
    this.name = "RateLimitError";
    this.resetTime = resetTime;
    this.remainingRequests = remainingRequests;
  }
}

/**
 * Configuration options for the rate limiting middleware.
 */
export interface RateLimitMiddlewareOptions extends RateLimiterOptions {
  /**
   * Whether to throw an error when rate limit is exceeded.
   * If false, the middleware will set a 429 status response.
   * @default true
   */
  throwOnRateLimit?: boolean;

  /**
   * Custom error message when rate limit is exceeded.
   */
  errorMessage?: string;
}

/**
 * Creates a rate limiting middleware for FetchClient.
 * @param options - Rate limiting configuration options
 * @returns A FetchClient middleware function
 */
export function createRateLimitMiddleware(
  options: RateLimitMiddlewareOptions,
): FetchClientMiddleware {
  const rateLimiter = new RateLimiter(options);
  const throwOnRateLimit = options.throwOnRateLimit ?? true;

  return async (context: FetchClientContext, next: () => Promise<void>) => {
    const url = context.request.url;
    const method = context.request.method || "GET";

    // Check if request is allowed
    if (!rateLimiter.isAllowed(url, method)) {
      const resetTime = rateLimiter.getResetTime(url, method) ?? Date.now();
      const remainingRequests = rateLimiter.getRemainingRequests(url, method);

      if (throwOnRateLimit) {
        throw new RateLimitError(
          resetTime,
          remainingRequests,
          options.errorMessage,
        );
      } else {
        // Create a 429 Too Many Requests response
        const headers = new Headers({
          "Content-Type": "application/problem+json",
          "X-RateLimit-Limit": options.maxRequests.toString(),
          "X-RateLimit-Remaining": remainingRequests.toString(),
          "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
          "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
        });

        const problem = new ProblemDetails();
        problem.status = 429;
        problem.title = "Too Many Requests";
        problem.detail = options.errorMessage ||
          `Rate limit exceeded. Try again after ${
            new Date(resetTime).toISOString()
          }`;
        problem.type = "about:blank";

        context.response = {
          url: context.request.url,
          status: 429,
          statusText: "Too Many Requests",
          body: null,
          bodyUsed: true,
          ok: false,
          headers: headers,
          redirected: false,
          type: "basic",
          problem: problem,
          data: null,
          meta: { links: {} },
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
        return;
      }
    }

    // Continue with the request
    await next();

    // Note: We cannot modify response headers after the response is created
    // as Response headers are read-only. Rate limit information is only
    // provided in error responses (429) where we control the entire response.
  };
}

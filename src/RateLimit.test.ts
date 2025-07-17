import { assertEquals, assertRejects } from "@std/assert";
import { FetchClientProvider } from "./FetchClientProvider.ts";
import {
  RateLimitError,
  type RateLimitMiddlewareOptions,
} from "./RateLimitMiddleware.ts";
import type { FetchClientResponse } from "./FetchClientResponse.ts";
import { RateLimiter } from "./RateLimiter.ts";

// Mock fetch function for testing
const createMockFetch = (response: {
  status?: number;
  statusText?: string;
  body?: string;
  headers?: Record<string, string>;
} = {}) => {
  return (
    _input: RequestInfo | URL,
    _init?: RequestInit,
  ): Promise<Response> => {
    const headers = new Headers(response.headers || {});
    headers.set("Content-Type", "application/json");

    return Promise.resolve(
      new Response(response.body || JSON.stringify({ success: true }), {
        status: response.status || 200,
        statusText: response.statusText || "OK",
        headers,
      }),
    );
  };
};

Deno.test("RateLimiter - basic functionality", () => {
  const rateLimiter = new RateLimiter({
    maxRequests: 2,
    windowMs: 1000,
  });

  // First request should be allowed
  assertEquals(rateLimiter.isAllowed("http://example.com", "GET"), true);
  assertEquals(rateLimiter.getRequestCount("http://example.com", "GET"), 1);
  assertEquals(
    rateLimiter.getRemainingRequests("http://example.com", "GET"),
    1,
  );

  // Second request should be allowed
  assertEquals(rateLimiter.isAllowed("http://example.com", "GET"), true);
  assertEquals(rateLimiter.getRequestCount("http://example.com", "GET"), 2);
  assertEquals(
    rateLimiter.getRemainingRequests("http://example.com", "GET"),
    0,
  );

  // Third request should be denied
  assertEquals(rateLimiter.isAllowed("http://example.com", "GET"), false);
  assertEquals(rateLimiter.getRequestCount("http://example.com", "GET"), 2);
  assertEquals(
    rateLimiter.getRemainingRequests("http://example.com", "GET"),
    0,
  );
});

Deno.test("RateLimiter - key generator", () => {
  const rateLimiter = new RateLimiter({
    maxRequests: 1,
    windowMs: 1000,
    keyGenerator: (url, method) => `${method}:${url}`,
  });

  // Different methods should have separate buckets
  assertEquals(rateLimiter.isAllowed("http://example.com", "GET"), true);
  assertEquals(rateLimiter.isAllowed("http://example.com", "POST"), true);
  assertEquals(rateLimiter.isAllowed("http://example.com", "GET"), false);
  assertEquals(rateLimiter.isAllowed("http://example.com", "POST"), false);
});

Deno.test("RateLimiter - time window expiry", async () => {
  const rateLimiter = new RateLimiter({
    maxRequests: 1,
    windowMs: 100, // 100ms window
  });

  // First request should be allowed
  assertEquals(rateLimiter.isAllowed("http://example.com", "GET"), true);

  // Second request should be denied
  assertEquals(rateLimiter.isAllowed("http://example.com", "GET"), false);

  // Wait for window to expire
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Request should be allowed again
  assertEquals(rateLimiter.isAllowed("http://example.com", "GET"), true);
});

Deno.test("RateLimitMiddleware - throws error when rate limit exceeded", async () => {
  const mockFetch = createMockFetch();
  const provider = new FetchClientProvider(mockFetch);

  const options: RateLimitMiddlewareOptions = {
    maxRequests: 1,
    windowMs: 1000,
    throwOnRateLimit: true,
  };

  provider.useRateLimit(options);

  const client = provider.getFetchClient();

  // First request should succeed
  const response1 = await client.get("http://example.com");
  assertEquals(response1.status, 200);

  // Second request should throw RateLimitError
  await assertRejects(
    () => client.get("http://example.com"),
    RateLimitError,
    "Rate limit exceeded",
  );
});

Deno.test("RateLimitMiddleware - returns 429 response when configured", async () => {
  const mockFetch = createMockFetch();
  const provider = new FetchClientProvider(mockFetch);

  const options: RateLimitMiddlewareOptions = {
    maxRequests: 1,
    windowMs: 1000,
    throwOnRateLimit: false,
    errorMessage: "Custom rate limit message",
  };

  provider.useRateLimit(options);

  const client = provider.getFetchClient();

  // First request should succeed
  const response1 = await client.get("http://example.com");
  assertEquals(response1.status, 200);

  // Second request should throw 429 response
  try {
    await client.get("http://example.com");
    throw new Error("Expected rate limit response to be thrown");
  } catch (error) {
    // The response object is thrown by FetchClient for 4xx/5xx status codes
    const response = error as FetchClientResponse<unknown>;
    assertEquals(response.status, 429);
    assertEquals(response.problem?.title, "Unexpected status code: 429");
    if (response.problem?.detail) {
      assertEquals(
        response.problem.detail.includes("Custom rate limit message"),
        true,
      );
    }
  }
});

Deno.test("RateLimitMiddleware - provides rate limit info in error response", async () => {
  const mockFetch = createMockFetch();
  const provider = new FetchClientProvider(mockFetch);

  const options: RateLimitMiddlewareOptions = {
    maxRequests: 1,
    windowMs: 1000,
    throwOnRateLimit: false,
  };

  provider.useRateLimit(options);

  const client = provider.getFetchClient();

  // First request should succeed
  const response1 = await client.get("http://example.com");
  assertEquals(response1.status, 200);

  // Second request should throw 429 with rate limit headers
  try {
    await client.get("http://example.com");
    throw new Error("Expected rate limit response to be thrown");
  } catch (error) {
    const response = error as FetchClientResponse<unknown>;
    assertEquals(response.status, 429);
    assertEquals(response.headers.get("X-RateLimit-Limit"), "1");
    assertEquals(response.headers.get("X-RateLimit-Remaining"), "0");
    assertEquals(response.headers.get("X-RateLimit-Reset") !== null, true);
    assertEquals(response.headers.get("Retry-After") !== null, true);
  }
});

Deno.test("createRateLimitMiddleware - custom key generator", async () => {
  const mockFetch = createMockFetch();
  const provider = new FetchClientProvider(mockFetch);

  let callCount = 0;
  const options: RateLimitMiddlewareOptions = {
    maxRequests: 1,
    windowMs: 1000,
    keyGenerator: (url, method) => {
      callCount++;
      return `custom-${method}-${url}`;
    },
    throwOnRateLimit: true,
  };

  provider.useRateLimit(options);

  const client = provider.getFetchClient();

  // First request should succeed and call key generator
  await client.get("http://example.com");
  assertEquals(callCount, 1);

  // Second request should call key generator and throw
  await assertRejects(
    () => client.get("http://example.com"),
    RateLimitError,
  );
  // The key generator might be called multiple times due to the rate limiting logic
  assertEquals(callCount >= 2, true);
});

Deno.test("RateLimitError - contains correct information", async () => {
  const mockFetch = createMockFetch();
  const provider = new FetchClientProvider(mockFetch);

  provider.useRateLimit({
    maxRequests: 1,
    windowMs: 1000,
    throwOnRateLimit: true,
  });

  const client = provider.getFetchClient();

  // First request should succeed
  await client.get("http://example.com");

  // Second request should throw with proper error info
  try {
    await client.get("http://example.com");
  } catch (error) {
    if (error instanceof RateLimitError) {
      assertEquals(error.name, "RateLimitError");
      assertEquals(error.remainingRequests, 0);
      assertEquals(typeof error.resetTime, "number");
      assertEquals(error.resetTime > Date.now(), true);
    } else {
      throw new Error("Expected RateLimitError");
    }
  }
});

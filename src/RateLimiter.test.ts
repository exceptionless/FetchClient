import { assertEquals } from "jsr:@std/assert";
import {
  createRateLimitMiddleware,
  type RateLimitConfig,
  RateLimiter,
} from "./RateLimiter.ts";
import type { FetchClientContext } from "./FetchClientContext.ts";
import type { RequestOptions } from "./RequestOptions.ts";
import { FetchClientProvider } from "./FetchClientProvider.ts";

Deno.test("RateLimiter - basic functionality", () => {
  const config: RateLimitConfig = {
    maxRequests: 3,
    windowMs: 1000,
  };
  const rateLimiter = new RateLimiter(config);

  // Should be able to make requests up to the limit
  assertEquals(rateLimiter.canMakeRequest(), true);
  assertEquals(rateLimiter.getCurrentRequestCount(), 0);
  assertEquals(rateLimiter.getRemainingRequests(), 3);

  // Record first request
  assertEquals(rateLimiter.recordRequest(), true);
  assertEquals(rateLimiter.getCurrentRequestCount(), 1);
  assertEquals(rateLimiter.getRemainingRequests(), 2);

  // Record second request
  assertEquals(rateLimiter.recordRequest(), true);
  assertEquals(rateLimiter.getCurrentRequestCount(), 2);
  assertEquals(rateLimiter.getRemainingRequests(), 1);

  // Record third request
  assertEquals(rateLimiter.recordRequest(), true);
  assertEquals(rateLimiter.getCurrentRequestCount(), 3);
  assertEquals(rateLimiter.getRemainingRequests(), 0);

  // Should not be able to make more requests
  assertEquals(rateLimiter.canMakeRequest(), false);

  // Fourth request should return false
  assertEquals(rateLimiter.recordRequest(), false);
});

Deno.test("RateLimiter - time window expiry", async () => {
  const config: RateLimitConfig = {
    maxRequests: 2,
    windowMs: 100, // Short window for testing
  };
  const rateLimiter = new RateLimiter(config);

  // Fill up the rate limit
  assertEquals(rateLimiter.recordRequest(), true);
  assertEquals(rateLimiter.recordRequest(), true);
  assertEquals(rateLimiter.canMakeRequest(), false);

  // Wait for the window to expire
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Should be able to make requests again
  assertEquals(rateLimiter.canMakeRequest(), true);
  assertEquals(rateLimiter.getCurrentRequestCount(), 0);
});

Deno.test("RateLimitMiddleware - creates 429 response", async () => {
  const config: RateLimitConfig = {
    maxRequests: 1,
    windowMs: 1000,
  };
  const rateLimiter = new RateLimiter(config);
  const middleware = createRateLimitMiddleware(rateLimiter);

  let nextCalled = 0;
  const mockNext = () => {
    nextCalled++;
    return Promise.resolve();
  };

  const mockContext: FetchClientContext = {
    options: {} as RequestOptions,
    request: new Request("https://example.com"),
    response: null,
  };

  // First request should go through
  await middleware(mockContext, mockNext);
  assertEquals(nextCalled, 1);

  // Second request should create a 429 response
  await middleware(mockContext, mockNext);
  assertEquals(nextCalled, 1); // next should not have been called again
  assertEquals(mockContext.response?.status, 429);
  assertEquals(mockContext.response?.ok, false);
  assertEquals(mockContext.response?.problem?.title, "Too Many Requests");
});

Deno.test("Rate limiting integration with real HTTP requests", async () => {
  const provider = new FetchClientProvider();

  // Enable strict rate limiting: 2 requests per 5 seconds
  provider.enableRateLimit({
    maxRequests: 2,
    windowMs: 5000,
  });

  const client = provider.getFetchClient();

  // First two requests should succeed
  const response1 = await client.getJSON(
    "https://jsonplaceholder.typicode.com/posts/1",
    {
      expectedStatusCodes: [200, 429],
    },
  );
  const response2 = await client.getJSON(
    "https://jsonplaceholder.typicode.com/posts/2",
    {
      expectedStatusCodes: [200, 429],
    },
  );

  assertEquals(response1.ok, true);
  assertEquals(response2.ok, true);

  // Third request should get a 429 response
  const response3 = await client.getJSON(
    "https://jsonplaceholder.typicode.com/posts/3",
    {
      expectedStatusCodes: [200, 429],
    },
  );
  assertEquals(response3.ok, false);
  assertEquals(response3.status, 429);
  assertEquals(response3.problem?.title, "Too Many Requests");
});

Deno.test("Default provider rate limiting", async () => {
  // Create a fresh provider for this test to avoid interference
  const provider = new FetchClientProvider();

  // Test the provider rate limiting functions
  provider.enableRateLimit({
    maxRequests: 2,
    windowMs: 1000,
  });

  const client = provider.getFetchClient();

  // First two requests should succeed
  const response1 = await client.getJSON(
    "https://jsonplaceholder.typicode.com/posts/1",
    {
      expectedStatusCodes: [200, 429],
    },
  );
  const response2 = await client.getJSON(
    "https://jsonplaceholder.typicode.com/posts/2",
    {
      expectedStatusCodes: [200, 429],
    },
  );

  assertEquals(response1.ok, true);
  assertEquals(response2.ok, true);

  // Third request should get a 429 response
  const response3 = await client.getJSON(
    "https://jsonplaceholder.typicode.com/posts/3",
    {
      expectedStatusCodes: [200, 429],
    },
  );
  assertEquals(response3.ok, false);
  assertEquals(response3.status, 429);
});

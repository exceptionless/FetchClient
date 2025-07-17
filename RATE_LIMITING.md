# Rate Limiting Middleware

The FetchClient now supports optional rate limiting middleware that can be
tracked at the provider level. This allows you to control the rate of outgoing
HTTP requests to prevent overwhelming APIs or to comply with rate limits.

## Features

- **Provider-level tracking**: Rate limits are managed at the
  FetchClientProvider level and apply to all FetchClient instances created from
  that provider
- **Flexible configuration**: Support for different rate limits per URL, HTTP
  method, or custom keys
- **Multiple response modes**: Can either throw errors or return 429 responses
  when rate limits are exceeded
- **Automatic cleanup**: Old requests outside the time window are automatically
  cleaned up
- **Thread-safe**: Uses in-memory buckets with proper time-based expiration

## Basic Usage

### Simple Rate Limiting

```typescript
import { FetchClientProvider } from "@exceptionless/fetchclient";

const provider = new FetchClientProvider();

// Enable rate limiting: 10 requests per second
provider.useRateLimit({
  maxRequests: 10,
  windowMs: 1000,
});

const client = provider.getFetchClient();

// This will be rate limited
try {
  const response = await client.get("https://api.example.com/data");
  console.log(response.data);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(
      `Rate limit exceeded. Try again at: ${new Date(error.resetTime)}`,
    );
  }
}
```

### Custom Key Generator

```typescript
// Rate limit per user or API key
provider.useRateLimit({
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  keyGenerator: (url, method) => {
    // Extract user ID from URL or use API key
    const userId = extractUserIdFromUrl(url);
    return `user:${userId}:${method}`;
  },
});
```

### Return 429 Instead of Throwing

```typescript
provider.useRateLimit({
  maxRequests: 5,
  windowMs: 1000,
  throwOnRateLimit: false, // Return 429 response instead of throwing
  errorMessage: "API rate limit exceeded. Please slow down.",
});

const client = provider.getFetchClient();

try {
  const response = await client.get("https://api.example.com/data");
  // This won't be reached if rate limited
} catch (response) {
  // FetchClient throws 4xx/5xx responses
  if (response.status === 429) {
    console.log("Rate limited:", response.problem.detail);
    console.log("Retry after:", response.headers.get("Retry-After"));
  }
}
```

## Configuration Options

### RateLimitMiddlewareOptions

```typescript
interface RateLimitMiddlewareOptions {
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
   */
  keyGenerator?: (url: string, method: string) => string;

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

  /**
   * Callback function called when rate limit is exceeded.
   */
  onRateLimitExceeded?: (resetTime: number) => void;
}
```

## Provider Methods

### `useRateLimit(options)`

Enables rate limiting with the specified configuration. If rate limiting is
already enabled, it replaces the existing configuration.

```typescript
provider.useRateLimit({
  maxRequests: 50,
  windowMs: 60000, // 1 minute
});
```

### `removeRateLimit()`

Disables rate limiting for all FetchClient instances created by this provider.

```typescript
provider.removeRateLimit();
```

### `isRateLimitEnabled`

Returns whether rate limiting is currently enabled.

```typescript
if (provider.isRateLimitEnabled) {
  console.log("Rate limiting is active");
}
```

## Error Handling

### RateLimitError

When `throwOnRateLimit` is `true` (default), a `RateLimitError` is thrown when
the rate limit is exceeded:

```typescript
import { RateLimitError } from "@exceptionless/fetchclient";

try {
  await client.get("https://api.example.com/data");
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limit exceeded`);
    console.log(`Reset time: ${new Date(error.resetTime)}`);
    console.log(`Remaining requests: ${error.remainingRequests}`);

    // Wait until reset time
    const waitTime = error.resetTime - Date.now();
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      // Retry the request
    }
  }
}
```

### 429 Response

When `throwOnRateLimit` is `false`, a 429 response is returned with helpful
headers:

```typescript
try {
  await client.get("https://api.example.com/data");
} catch (response) {
  if (response.status === 429) {
    const limit = response.headers.get("X-RateLimit-Limit");
    const remaining = response.headers.get("X-RateLimit-Remaining");
    const reset = response.headers.get("X-RateLimit-Reset");
    const retryAfter = response.headers.get("Retry-After");

    console.log(`Rate limit: ${remaining}/${limit} requests remaining`);
    console.log(`Reset at: ${new Date(parseInt(reset) * 1000)}`);
    console.log(`Retry after: ${retryAfter} seconds`);
  }
}
```

## Advanced Examples

### Different Limits for Different APIs

```typescript
// Create separate providers for different APIs
const githubProvider = new FetchClientProvider();
githubProvider.setBaseUrl("https://api.github.com");
githubProvider.useRateLimit({
  maxRequests: 5000,
  windowMs: 60 * 60 * 1000, // 1 hour (GitHub's limit)
});

const twitterProvider = new FetchClientProvider();
twitterProvider.setBaseUrl("https://api.twitter.com");
twitterProvider.useRateLimit({
  maxRequests: 300,
  windowMs: 15 * 60 * 1000, // 15 minutes (Twitter's limit)
});
```

### Per-User Rate Limiting

```typescript
provider.useRateLimit({
  maxRequests: 1000,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  keyGenerator: (url, method) => {
    // Extract user ID from authentication header or URL
    const userId = getCurrentUserId();
    return `user:${userId}`;
  },
  onRateLimitExceeded: (resetTime) => {
    console.log(`User rate limit exceeded. Resets at ${new Date(resetTime)}`);
    // Log to analytics, send notification, etc.
  },
});
```

### Graceful Degradation

```typescript
provider.useRateLimit({
  maxRequests: 10,
  windowMs: 1000,
  throwOnRateLimit: false,
});

const client = provider.getFetchClient();

async function makeRequestWithFallback(url: string) {
  try {
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    if (error.status === 429) {
      // Use cached data or default response
      return getCachedData(url) ||
        { message: "Service temporarily unavailable" };
    }
    throw error;
  }
}
```

## Rate Limiter Class

You can also use the `RateLimiter` class directly for custom implementations:

```typescript
import { RateLimiter } from "@exceptionless/fetchclient";

const rateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 1000,
});

if (rateLimiter.isAllowed("https://api.example.com", "GET")) {
  // Make request
  console.log(
    `Remaining: ${
      rateLimiter.getRemainingRequests("https://api.example.com", "GET")
    }`,
  );
} else {
  const resetTime = rateLimiter.getResetTime("https://api.example.com", "GET");
  console.log(`Rate limited. Reset at: ${new Date(resetTime)}`);
}
```

## Best Practices

1. **Set appropriate limits**: Choose rate limits that balance performance with
   API requirements
2. **Use key generators**: Implement per-user or per-API-key rate limiting for
   multi-tenant applications
3. **Handle errors gracefully**: Always provide fallback mechanisms when rate
   limits are exceeded
4. **Monitor usage**: Use the `onRateLimitExceeded` callback to log and monitor
   rate limit violations
5. **Test thoroughly**: Test your rate limiting configuration under load to
   ensure it works as expected
6. **Consider caching**: Implement caching to reduce the number of requests
   needed
7. **Respect external limits**: Configure your rate limits to be slightly below
   external API limits

## Thread Safety

The rate limiter is designed to be thread-safe within a single JavaScript
context. However, it maintains state in memory, so rate limits are not shared
across different processes or browser tabs. For distributed rate limiting,
consider using external stores like Redis with a custom implementation.

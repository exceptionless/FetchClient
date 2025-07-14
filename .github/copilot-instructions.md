# FetchClient - Copilot Instructions

## Project Architecture

This is a **Deno-first TypeScript library** that provides a typed HTTP client
with middleware support. The project builds to NPM for Node.js compatibility via
`@deno/dnt`.

### Core Components

- **`FetchClient`** - Main HTTP client class with typed JSON methods (`getJSON`,
  `postJSON`, etc.)
- **`FetchClientProvider`** - Singleton pattern for shared configuration,
  caching, and rate limiting across multiple client instances
- **Middleware System** - Pipeline architecture using `FetchClientContext` and
  `next()` functions
- **Rate Limiting** - Built-in middleware for HTTP 429 responses with
  `Retry-After` headers
- **Caching** - Key-based response caching with TTL support
- **Problem Details** - RFC 9457 compliant error handling

### Key Patterns

**Provider Pattern**: Use `FetchClientProvider` for shared state:

```typescript
const provider = new FetchClientProvider();
provider.enableRateLimit({ maxRequests: 100, windowMs: 60000 });
const client = provider.getFetchClient();
```

**Middleware Chain**: Always call `next()`, modify `context.response` after:

```typescript
provider.useMiddleware(async (ctx, next) => {
  // pre-processing
  await next();
  // post-processing with ctx.response
});
```

**Global Helpers**: Default provider instance accessible via `useFetchClient()`,
`getJSON()`, `setBaseUrl()`

## Development Workflow

### Essential Commands

- `deno task test` - Run tests with network access
- `deno task build` - Generate NPM package in `./npm/`
- `deno task check` - Type check all TypeScript files
- `deno lint` and `deno fmt` - Linting and formatting

### Testing Patterns

- Use `FetchClientProvider` with `fakeFetch` for mocking
- Rate limiting tests require `await delay()` for time windows
- Cache tests use `provider.cache.has()` and `provider.cache.delete()` for
  assertions
- Middleware tests check `ctx.response` before/after `next()`

### File Organization

- `src/` - Core TypeScript source
- `mod.ts` - Main export file
- `scripts/build.ts` - Deno-to-NPM build configuration
- Tests are co-located (`.test.ts` suffix)

## Critical Implementation Details

**Context Mutation**: Middleware modifies `FetchClientContext` in-place. The
`response` property is null before `next()` and populated after.

**Error Handling**: Uses `expectedStatusCodes` array instead of try/catch for
HTTP errors. `errorCallback` can suppress throwing.

**Cache Keys**: Use array format `["resource", "id"]` for hierarchical cache
invalidation.

**Rate Limiting**: Middleware returns HTTP 429 responses instead of throwing
errors. Check `response.status === 429` for rate limit handling.

**Schema Validation**: Use `meta: { schema: ZodSchema }` option with middleware
for runtime validation.

**Date Parsing**: Enable with `shouldParseDates: true` option or custom
`reviver` function.

## Integration Points

- **Zod**: Runtime schema validation via middleware
- **Problem Details**: Standard error format for HTTP APIs
- **AbortController**: Native timeout and cancellation support
- **Headers**: Link header parsing for pagination

When working on this codebase, always consider the middleware pipeline order and
the provider/client distinction for shared vs. instance-specific behavior.

![Foundatio](https://raw.githubusercontent.com/FoundatioFx/Foundatio/master/media/foundatio-dark-bg.svg#gh-dark-mode-only "Foundatio")
![Foundatio](https://raw.githubusercontent.com/FoundatioFx/Foundatio/master/media/foundatio.svg#gh-light-mode-only "Foundatio")

[![NPM](https://img.shields.io/npm/v/%40foundatio%2Ffetchclient)](https://www.npmjs.com/package/@foundatio/fetchclient)
[![JSR](https://jsr.io/badges/@foundatio/fetchclient)](https://jsr.io/@foundatio/fetchclient)
[![Build status](https://github.com/FoundatioFx/Foundatio/workflows/Build/badge.svg)](https://github.com/FoundatioFx/Foundatio/actions)
[![Discord](https://img.shields.io/discord/715744504891703319)](https://discord.gg/6HxgFCx)

<!-- deno-fmt-ignore-file -->

FetchClient is a library that makes it easier to use the fetch API for JSON
APIs. It provides the following features:

- [Typed Response](#typed-response) - Full TypeScript support with strongly
  typed responses
- [Functional](#functional) - Standalone functions for simple usage
- [Model Validator](#model-validator) - Built-in validation with Problem Details
  support
- [Caching](#caching) - Response caching with TTL and programmatic invalidation
- [Middleware](#middleware) - Extensible middleware pipeline for
  request/response handling
- [Rate Limiting](#rate-limiting) - Built-in rate limiting with per-domain
  support
- [Request Timeout](#request-timeout) - Configurable timeouts with AbortSignal
  support
- [Error Handling](#error-handling) - Comprehensive error handling with Problem
  Details
- [Authentication](#authentication) - Built-in Bearer token support
- [Base URL](#base-url) - Global base URL configuration
- [Loading State](#loading-state) - Track request loading state with events

## Install

```shell
npm install --save @foundatio/fetchclient
```

## Docs

[API Documentation](https://jsr.io/@foundatio/fetchclient/doc)

## Usage

### Typed Response

```ts
import { FetchClient } from "@foundatio/fetchclient";

type Products = {
  products: Array<{ id: number; name: string }>;
};

const client = new FetchClient();
const response = await client.getJSON<Products>(
  `https://dummyjson.com/products/search?q=iphone&limit=10`,
);

const products = response.data;
```

### Functional

```ts
import { getJSON, postJSON } from "@foundatio/fetchclient";

type Product = { id: number; title: string };
type Products = { products: Product[] };

const response = await postJSON<Product>(
  "https://dummyjson.com/products/add",
  {
    name: "iPhone 13",
  },
);

const product = await getJSON<Product>(
  `https://dummyjson.com/products/${response.data!.id}`,
);
```

### Model Validator

```ts
import { FetchClient, setModelValidator } from "@foundatio/fetchclient";

setModelValidator(async (data: object | null) => {
  // use zod or any other validator
  const problem = new ProblemDetails();
  const d = data as { password: string };
  if (d?.password?.length < 6) {
    problem.errors.password = [
      "Password must be longer than or equal to 6 characters.",
    ];
  }
  return problem;
});

const client = new FetchClient();
const data = {
  email: "test@test",
  password: "test",
};

const response = await client.postJSON(
  "https://jsonplaceholder.typicode.com/todos/1",
  data,
);

if (!response.ok) {
  // check response problem
  console.log(response.problem.detail);
}
```

### Caching

```ts
import { FetchClient } from "@foundatio/fetchclient";

type Todo = { userId: number; id: number; title: string; completed: boolean };

const client = new FetchClient();
const response = await client.getJSON<Todo>(
  `https://jsonplaceholder.typicode.com/todos/1`,
  {
    cacheKey: ["todos", "1"],
    cacheDuration: 1000 * 60, // expires in 1 minute
  },
);

// invalidate programmatically
client.cache.delete(["todos", "1"]);
```

### Middleware

```ts
import { FetchClient, useMiddleware } from "@foundatio/fetchclient";

type Products = {
  products: Array<{ id: number; name: string }>;
};

useMiddleware(async (ctx, next) => {
  console.log("starting request");
  await next();
  console.log("completed request");
});

const client = new FetchClient();
const response = await client.getJSON<Products>(
  `https://dummyjson.com/products/search?q=iphone&limit=10`,
);
```

### Rate Limiting

```ts
import { FetchClient, useRateLimit } from "@foundatio/fetchclient";

// Enable rate limiting globally with 100 requests per minute
useRateLimit({
  maxRequests: 100,
  windowSeconds: 60,
});

const client = new FetchClient();
const response = await client.getJSON(
  `https://api.example.com/data`,
);
```

### Request Timeout

```ts
import { FetchClient } from "@foundatio/fetchclient";

const client = new FetchClient();

// Set timeout for individual requests
const response = await client.getJSON(
  `https://api.example.com/data`,
  { timeout: 5000 }, // 5 seconds
);

// Use AbortSignal for cancellation
const controller = new AbortController();
setTimeout(() => controller.abort(), 1000);

const response2 = await client.getJSON(
  `https://api.example.com/data`,
  { signal: controller.signal },
);
```

### Error Handling

```ts
import { FetchClient } from "@foundatio/fetchclient";

const client = new FetchClient();

try {
  const response = await client.getJSON(`https://api.example.com/data`);
} catch (error) {
  // Handle HTTP errors (4xx, 5xx)
  if (error.problem) {
    console.log(error.problem.title);
    console.log(error.problem.detail);
  }
}

// Or handle specific status codes
const response = await client.getJSON(
  `https://api.example.com/data`,
  {
    expectedStatusCodes: [404, 500],
    errorCallback: (response) => {
      if (response.status === 404) {
        console.log("Resource not found");
        return true; // Don't throw
      }
    },
  },
);
```

### Authentication

```ts
import { FetchClient, setAccessTokenFunc } from "@foundatio/fetchclient";

// Set global access token function
setAccessTokenFunc(() => localStorage.getItem("token"));

const client = new FetchClient();
const response = await client.getJSON(`https://api.example.com/data`);
// Automatically adds Authorization: Bearer <token> header
```

### Base URL

```ts
import { FetchClient, setBaseUrl } from "@foundatio/fetchclient";

// Set global base URL
setBaseUrl("https://api.example.com");

const client = new FetchClient();
const response = await client.getJSON(`/users/123`);
// Requests to https://api.example.com/users/123
```

### Loading State

```ts
import { FetchClient } from "@foundatio/fetchclient";

const client = new FetchClient();

// Track loading state
client.loading.on((isLoading) => {
  console.log(`Loading: ${isLoading}`);
});

// Check current loading state
console.log(client.isLoading);
console.log(client.requestCount);
```

Also, take a look at the tests:

[FetchClient Tests](src/FetchClient.test.ts)

## Contributing

Run tests:

```shell
deno run test
```

Lint code:

```shell
deno lint
```

Format code:

```shell
deno fmt
```

Type check code:

```shell
deno run check
```

## License

MIT © [Foundatio](https://exceptionless.com)

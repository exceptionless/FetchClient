<!-- deno-fmt-ignore-file -->
# FetchClient [![CI](https://github.com/exceptionless/fetchclient/workflows/CI/badge.svg)](https://github.com/exceptionless/fetchclient/actions?query=workflow%3ACI) [![NPM](https://img.shields.io/npm/v/%40exceptionless%2Ffetchclient)](https://www.npmjs.com/package/@exceptionless/fetchclient) [![JSR](https://jsr.io/badges/@exceptionless/fetchclient)](https://jsr.io/@exceptionless/fetchclient)

FetchClient is a library that makes it easier to use the fetch API for JSON APIs. It provides the following features:

  - [Typed Response](#typed-response)
  - [Functional Typed Response](#functional-typed-response)
  - [Model Validator](#model-validator)
  - [Caching](#caching)
  - [Middleware](#middleware)
  - [Rate Limiting](#rate-limiting)

## Install

```shell
npm install --save @exceptionless/fetchclient
```

## Docs

[API Documentation](https://jsr.io/@exceptionless/fetchclient/doc)

## Usage

### Typed Response

```ts
import { FetchClient } from '@exceptionless/fetchclient';

type Products = {
  products: Array<{ id: number; name: string }>;
};

const client = new FetchClient();
const response = await client.getJSON<Products>(
  `https://dummyjson.com/products/search?q=iphone&limit=10`,
);

const products = response.data;
```

### Functional Typed Response

```ts
import { getJSON } from '@exceptionless/fetchclient';

type Products = {
  products: Array<{ id: number; name: string }>;
};

const response = await getJSON<Products>(
  `https://dummyjson.com/products/search?q=iphone&limit=10`,
);

const products = response.data;
```

### Model Validator

```ts
import { FetchClient, setModelValidator } from '@exceptionless/fetchclient';

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
import { FetchClient } from '@exceptionless/fetchclient';

type Todo = { userId: number; id: number; title: string; completed: boolean };

const client = new FetchClient();
const response = await client.getJSON<Todo>(
  `https://jsonplaceholder.typicode.com/todos/1`,
  {
    cacheKey: ["todos", "1"],
    cacheDuration: 1000 * 60, // expires in 1 minute
  }
);

// invalidate programmatically
client.cache.delete(["todos", "1"]);
```

### Middleware

```ts
import { FetchClient, useMiddleware } from '@exceptionless/fetchclient';

type Products = {
  products: Array<{ id: number; name: string }>;
};

useMiddleware(async (ctx, next) => {
  console.log('starting request')
  await next();
  console.log('completed request')
});

const client = new FetchClient();
const response = await client.getJSON<Products>(
  `https://dummyjson.com/products/search?q=iphone&limit=10`,
);
```

### Rate Limiting

```ts
import { FetchClient, useRateLimit } from '@exceptionless/fetchclient';

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

MIT © [Exceptionless](https://exceptionless.com)

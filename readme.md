<!-- deno-fmt-ignore-file -->
# FetchClient [![CI](https://github.com/exceptionless/fetchclient/workflows/CI/badge.svg)](https://github.com/exceptionless/fetchclient/actions?query=workflow%3ACI) [![JSR](https://jsr.io/badges/@exceptionless/fetchclient)](https://jsr.io/@exceptionless/fetchclient)

FetchClient is a library that makes it easier to use the fetch API for JSON APIs. It provides the following features:

* [Makes fetch easier to use for JSON APIs](#typed-response)
* [Automatic model validation](#model-validator)
* [Caching](#caching)
* [Middleware](#middleware)
* [Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html) support
* Option to parse dates in responses

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

### Typed Response Using a Function

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

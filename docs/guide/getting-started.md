# Getting Started

## Install

```bash
npm install @foundatiofx/fetchclient
```

## Quick Usage

### Typed Response

```ts
import { FetchClient } from "@foundatiofx/fetchclient";

type Products = { products: Array<{ id: number; name: string }> };

const client = new FetchClient();
const response = await client.getJSON<Products>(
  `https://dummyjson.com/products/search?q=iphone&limit=10`,
);

const products = response.data;
```

### Functional API

```ts
import { getJSON, postJSON } from "@foundatiofx/fetchclient";

type Product = { id: number; title: string };

const { data: created } = await postJSON<Product>(
  "https://dummyjson.com/products/add",
  { name: "iPhone 13" },
);

const { data: product } = await getJSON<Product>(
  `https://dummyjson.com/products/${created!.id}`,
);
```

### Middleware

```ts
import { FetchClient, useMiddleware } from "@foundatiofx/fetchclient";

useMiddleware(async (ctx, next) => {
  console.log("starting request");
  await next();
  console.log("completed request");
});

const client = new FetchClient();
await client.getJSON(`https://dummyjson.com/products/search?q=iphone`);
```

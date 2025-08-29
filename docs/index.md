---
layout: home
hero:
  name: Foundatio FetchClient
  text: Typed, ergonomic fetch for JS/TS
  tagline: JSON helpers, caching, middleware, rate limiting, and great DX
  image:
    src: https://raw.githubusercontent.com/FoundatioFx/Foundatio/main/media/foundatio-icon.png
    alt: Foundatio
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/FoundatioFx/FetchClient
features:
  - icon: ⚡
    title: Typed Responses
    details: Full TypeScript support for strongly-typed JSON results.
  - icon: 🧩
    title: Middleware & Caching
    details: Compose middleware and cache responses with TTL.
  - icon: 🎯
    title: Rate Limits & Timeouts
    details: Built-in rate limiting, timeouts, and robust error handling.
---

## Quick Example

```ts
import { FetchClient } from "@foundatiofx/fetchclient";

type Products = { products: Array<{ id: number; name: string }> };

const client = new FetchClient();
const res = await client.getJSON<Products>(
  `https://dummyjson.com/products/search?q=iphone&limit=10`,
);

console.log(res.data?.products.length);
```

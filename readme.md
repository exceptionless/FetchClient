![Foundatio](https://raw.githubusercontent.com/foundatiofx/foundatio/master/media/foundatio-dark-bg.svg#gh-dark-mode-only "Foundatio")
![Foundatio](https://raw.githubusercontent.com/foundatiofx/foundatio/master/media/foundatio.svg#gh-light-mode-only "Foundatio")

[![NPM](https://img.shields.io/npm/v/%40foundatiofx%2Ffetchclient)](https://www.npmjs.com/package/@foundatiofx/fetchclient)
[![JSR](https://jsr.io/badges/@foundatiofx/fetchclient)](https://jsr.io/@foundatiofx/fetchclient)
[![Build status](https://github.com/foundatiofx/foundatio/workflows/Build/badge.svg)](https://github.com/foundatiofx/foundatio/actions)
[![Discord](https://img.shields.io/discord/715744504891703319)](https://discord.gg/6HxgFCx)

FetchClient is a tiny, typed wrapper around `fetch` with JSON helpers, caching,
middleware, rate limiting, timeouts, and friendly error handling.

## Install

```bash
npm install @foundatiofx/fetchclient
```

## Quick Example

```ts
import { FetchClient } from "@foundatiofx/fetchclient";

type Products = { products: Array<{ id: number; name: string }> };

const client = new FetchClient();
const { data } = await client.getJSON<Products>(
  `https://dummyjson.com/products/search?q=iphone&limit=10`,
);

console.log(data?.products.length);
```

## Documentation

- Guide & Examples: <https://fetchclient.foundatio.dev>
  - Getting Started, Usage Examples, Contributing
- API Reference: <https://jsr.io/@foundatiofx/fetchclient/doc>

---

MIT © [Foundatio](https://exceptionless.com)

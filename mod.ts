import { FetchClientProvider } from "./src/FetchClientProvider.ts";
import type { FetchClient } from "./src/FetchClient.ts";

export * from "./src/FetchClient.ts";
export type { FetchClientResponse } from "./src/FetchClientResponse.ts";
export { ProblemDetails } from "./src/ProblemDetails.ts";
export { type CacheKey, FetchClientCache } from "./src/FetchClientCache.ts";
export type { RequestOptions } from "./src/RequestOptions.ts";
export type { FetchClientMiddleware } from "./src/FetchClientMiddleware.ts";
export type { FetchClientContext } from "./src/FetchClientContext.ts";
export { FetchClientProvider } from "./src/FetchClientProvider.ts";

const provider = new FetchClientProvider();

/**
 * A global singleton instance of the FetchClient.
 */
export const instance: FetchClient = provider.getFetchClient();

/**
 * A global default singleton instance of the FetchClientProvider.
 */
export const defaultProvider: FetchClientProvider = provider;

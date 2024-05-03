import { FetchClient } from "./src/FetchClient.ts";

export * from "./src/FetchClient.ts";
export type { FetchClientResponse } from "./src/FetchClientResponse.ts";
export { ProblemDetails } from "./src/ProblemDetails.ts";
export { type CacheKey, FetchClientCache } from "./src/FetchClientCache.ts";
export type { RequestOptions } from "./src/RequestOptions.ts";
export type { FetchClientMiddleware } from "./src/FetchClientMiddleware.ts";
export type { FetchClientContext } from "./src/FetchClientContext.ts";

/**
 * A global singleton instance of the FetchClient.
 */
export const instance: FetchClient = new FetchClient();

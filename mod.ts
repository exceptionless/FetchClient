import {
  defaultInstance,
  type FetchClientProvider,
} from "./src/FetchClientProvider.ts";
import type { FetchClient } from "./src/FetchClient.ts";
import type { FetchClientMiddleware } from "./src/FetchClientMiddleware.ts";
import type { ProblemDetails } from "./src/ProblemDetails.ts";

export * from "./src/FetchClient.ts";
export type { FetchClientResponse } from "./src/FetchClientResponse.ts";
export { ProblemDetails } from "./src/ProblemDetails.ts";
export { type CacheKey, FetchClientCache } from "./src/FetchClientCache.ts";
export type { RequestOptions } from "./src/RequestOptions.ts";
export type { FetchClientMiddleware } from "./src/FetchClientMiddleware.ts";
export type { FetchClientContext } from "./src/FetchClientContext.ts";
export { FetchClientProvider } from "./src/FetchClientProvider.ts";

/**
 * A global singleton instance of the FetchClient.
 */
export const instance: FetchClient = defaultInstance.getFetchClient();

/**
 * A global default singleton instance of the FetchClientProvider.
 */
export const defaultProvider: FetchClientProvider = defaultInstance;

export function setDefaultBaseUrl(baseUrl: string) {
  defaultProvider.setDefaultBaseUrl(baseUrl);
}

export function setAccessTokenFunc(accessTokenFunc: () => string | null) {
  defaultProvider.setAccessTokenFunc(accessTokenFunc);
}

export function setDefaultModelValidator(
  validate: (model: object | null) => Promise<ProblemDetails | null>,
) {
  defaultProvider.setDefaultModelValidator(validate);
}

export function useGlobalMiddleware(middleware: FetchClientMiddleware) {
  defaultProvider.useMiddleware(middleware);
}

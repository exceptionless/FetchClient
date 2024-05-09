import {
  defaultInstance,
  type FetchClientProvider,
} from "./src/FetchClientProvider.ts";
import type { FetchClient, FetchClientOptions } from "./src/FetchClient.ts";
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

/**
 * Sets the default base URL for the FetchClient.
 * @param baseUrl - The base URL to use for requests.
 */
export function setDefaultBaseUrl(baseUrl: string) {
  defaultProvider.setDefaultBaseUrl(baseUrl);
}

/**
 * Sets the default access token function for the FetchClient.
 * @param accessTokenFunc - The function that retrieves the access token.
 */
export function setDefaultAccessTokenFunc(
  accessTokenFunc: () => string | null,
) {
  defaultProvider.setAccessTokenFunc(accessTokenFunc);
}

/**
 * Sets the default model validator function for the FetchClient.
 * @param validate - The function that validates the model.
 */
export function setDefaultModelValidator(
  validate: (model: object | null) => Promise<ProblemDetails | null>,
) {
  defaultProvider.setDefaultModelValidator(validate);
}

/**
 * Adds a middleware to the FetchClient.
 * @param middleware - The middleware function to be added.
 */
export function useDefaultMiddleware(middleware: FetchClientMiddleware) {
  defaultProvider.useMiddleware(middleware);
}

/**
 * Sets the default request options for the FetchClient.
 * @param options - The options to set as the default request options.
 */
export function setDefaultRequestOptions(options: FetchClientOptions) {
  defaultProvider.applyOptions(options);
}

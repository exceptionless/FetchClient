import type { FetchClient } from "./FetchClient.ts";
import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import type { FetchClientOptions } from "./FetchClientOptions.ts";
import {
  defaultInstance as defaultProvider,
  type FetchClientProvider,
} from "./FetchClientProvider.ts";
import type { ProblemDetails } from "./ProblemDetails.ts";
import type { RequestOptions } from "./RequestOptions.ts";

let getCurrentProviderFunc: () => FetchClientProvider | null = () => null;

/**
 * Gets a FetchClient instance.
 * @returns The FetchClient instance.
 */
export function useFetchClient(options?: FetchClientOptions): FetchClient {
  return getCurrentProvider().getFetchClient(options);
}

/**
 * Gets the current FetchClientProvider.
 * @returns The current FetchClientProvider.
 */
export function getCurrentProvider(): FetchClientProvider {
  if (getCurrentProviderFunc === null) {
    return defaultProvider;
  }

  return getCurrentProviderFunc() ?? defaultProvider;
}

/**
 * Sets the function that retrieves the current FetchClientProvider using whatever scoping mechanism is available.
 * @param getProviderFunc - The function that retrieves the current FetchClientProvider.
 * @returns void
 */
export function setCurrentProviderFunc(
  getProviderFunc: () => FetchClientProvider | null,
) {
  getCurrentProviderFunc = getProviderFunc;
}

/**
 * Sets the base URL for any FetchClient instances created by the current provider.
 * @param baseUrl - The base URL to use for requests.
 */
export function setBaseUrl(baseUrl: string) {
  getCurrentProvider().setBaseUrl(baseUrl);
}

/**
 * Sets the access token function for any FetchClient instances created by the current provider.
 * @param accessTokenFunc - The function that retrieves the access token.
 */
export function setAccessTokenFunc(
  accessTokenFunc: () => string | null,
) {
  getCurrentProvider().setAccessTokenFunc(accessTokenFunc);
}

/**
 * Sets the model validator function for any FetchClient instances created by the current provider.
 * @param validate - The function that validates the model.
 */
export function setModelValidator(
  validate: (model: object | null) => Promise<ProblemDetails | null>,
) {
  getCurrentProvider().setModelValidator(validate);
}

/**
 * Adds a middleware to any FetchClient instances created by the current provider.
 * @param middleware - The middleware function to be added.
 */
export function useMiddleware(middleware: FetchClientMiddleware) {
  getCurrentProvider().useMiddleware(middleware);
}

/**
 * Sets the default request options for any FetchClient instances created by the current provider.
 * @param options - The options to set as the default request options.
 */
export function setRequestOptions(options: RequestOptions) {
  getCurrentProvider().applyOptions({ defaultRequestOptions: options });
}

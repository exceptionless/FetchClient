import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import {
  defaultInstance as defaultProvider,
  type FetchClientProvider,
} from "./FetchClientProvider.ts";
import type { FetchClientResponse } from "./FetchClientResponse.ts";
import type { ProblemDetails } from "./ProblemDetails.ts";
import type { GetRequestOptions, RequestOptions } from "./RequestOptions.ts";

let getCurrentProviderFunc: () => FetchClientProvider | null = () => null;

/**
 * Gets the FetchClientProvider for the current scope.
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

/**
 * Sends a GET request to the specified URL. (Uses settings from the current provider)
 *
 * @param url - The URL to send the GET request to.
 * @param options - The optional request options.
 * @returns A promise that resolves to the response of the GET request.
 */
export function get(
  url: string,
  options?: GetRequestOptions,
): Promise<FetchClientResponse<unknown>> {
  return getCurrentProvider().getFetchClient().get(url, options);
}

/**
 * Sends a GET request to the specified URL and returns the response as JSON. (Uses settings from the current provider)
 * @param url - The URL to send the GET request to.
 * @param options - Optional request options.
 * @returns A promise that resolves to the response as JSON.
 */
export function getJSON<T>(
  url: string,
  options?: GetRequestOptions,
): Promise<FetchClientResponse<T>> {
  return getCurrentProvider().getFetchClient().getJSON(url, options);
}

/**
 * Sends a POST request to the specified URL. (Uses settings from the current provider)
 *
 * @param url - The URL to send the request to.
 * @param body - The request body, can be an object, a string, or FormData.
 * @param options - Additional options for the request.
 * @returns A promise that resolves to a FetchClientResponse object.
 */
export function post(
  url: string,
  body?: object | string | FormData,
  options?: RequestOptions,
): Promise<FetchClientResponse<unknown>> {
  return getCurrentProvider().getFetchClient().post(url, body, options);
}

/**
 * Sends a POST request with JSON payload to the specified URL. (Uses settings from the current provider)
 *
 * @template T - The type of the response data.
 * @param {string} url - The URL to send the request to.
 * @param {object | string} [body] - The JSON payload to send with the request.
 * @param {RequestOptions} [options] - Additional options for the request.
 * @returns {Promise<FetchClientResponse<T>>} - A promise that resolves to the response data.
 */
export function postJSON<T>(
  url: string,
  body?: object | string,
  options?: RequestOptions,
): Promise<FetchClientResponse<T>> {
  return getCurrentProvider().getFetchClient().postJSON(url, body, options);
}

/**
 * Sends a PUT request to the specified URL with the given body and options. (Uses settings from the current provider)
 * @param url - The URL to send the request to.
 * @param body - The request body, can be an object, a string, or FormData.
 * @param options - The request options.
 * @returns A promise that resolves to a FetchClientResponse object.
 */
export function put(
  url: string,
  body?: object | string | FormData,
  options?: RequestOptions,
): Promise<FetchClientResponse<unknown>> {
  return getCurrentProvider().getFetchClient().put(url, body, options);
}

/**
 * Sends a PUT request with JSON payload to the specified URL. (Uses settings from the current provider)
 *
 * @template T - The type of the response data.
 * @param {string} url - The URL to send the request to.
 * @param {object | string} [body] - The JSON payload to send with the request.
 * @param {RequestOptions} [options] - Additional options for the request.
 * @returns {Promise<FetchClientResponse<T>>} - A promise that resolves to the response data.
 */
export function putJSON<T>(
  url: string,
  body?: object | string,
  options?: RequestOptions,
): Promise<FetchClientResponse<T>> {
  return getCurrentProvider().getFetchClient().putJSON(url, body, options);
}

/**
 * Sends a PATCH request to the specified URL with the provided body and options. (Uses settings from the current provider)
 * @param url - The URL to send the PATCH request to.
 * @param body - The body of the request. It can be an object, a string, or FormData.
 * @param options - The options for the request.
 * @returns A Promise that resolves to the response of the PATCH request.
 */
export function patch(
  url: string,
  body?: object | string | FormData,
  options?: RequestOptions,
): Promise<Response> {
  return getCurrentProvider().getFetchClient().patch(url, body, options);
}

/**
 * Sends a PATCH request with JSON payload to the specified URL. (Uses settings from the current provider)
 *
 * @template T - The type of the response data.
 * @param {string} url - The URL to send the request to.
 * @param {object | string} [body] - The JSON payload to send with the request.
 * @param {RequestOptions} [options] - Additional options for the request.
 * @returns {Promise<FetchClientResponse<T>>} - A promise that resolves to the response data.
 */
export function patchJSON<T>(
  url: string,
  body?: object | string,
  options?: RequestOptions,
): Promise<FetchClientResponse<T>> {
  return getCurrentProvider().getFetchClient().patchJSON(url, body, options);
}

/**
 * Sends a DELETE request to the specified URL. (Uses settings from the current provider)
 *
 * @param url - The URL to send the DELETE request to.
 * @param options - The options for the request.
 * @returns A promise that resolves to a `FetchClientResponse` object.
 */
export function deleteRequest(
  url: string,
  options?: RequestOptions,
): Promise<FetchClientResponse<unknown>> {
  return getCurrentProvider().getFetchClient().delete(url, options);
}

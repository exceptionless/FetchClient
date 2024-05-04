import { FetchClient } from "./FetchClient.ts";
import type { RequestOptions } from "./RequestOptions.ts";
import { Counter } from "./Counter.ts";
import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import type { ProblemDetails } from "./ProblemDetails.ts";
import { FetchClientCache } from "./FetchClientCache.ts";

type Fetch = typeof globalThis.fetch;

/**
 * Represents a provider for creating instances of the FetchClient class with shared default options and cache.
 */
export class FetchClientProvider {
  #getAccessToken: () => string | null = () => null;
  #defaultOptions: RequestOptions = {};
  #fetch: Fetch;
  #cache: FetchClientCache;
  #counter = new Counter();

  /**
   * Creates a new instance of FetchClientProvider.
   * @param fetch - The fetch function to use. If not provided, the global fetch function will be used.
   */
  constructor(fetch?: Fetch) {
    this.#cache = new FetchClientCache();
    this.#fetch = fetch ?? globalThis.fetch;
  }

  /**
   * Gets a value indicating whether there are ongoing requests.
   */
  public get isLoading(): boolean {
    return this.#counter.count > 0;
  }

  /**
   * Gets the number of ongoing requests.
   */
  public get requestCount(): number {
    return this.#counter.count;
  }

  /**
   * Gets the ongoing request counter.
   */
  public get counter(): Counter {
    return this.#counter;
  }

  /**
   * Gets the default options used for FetchClient instances.
   */
  public get defaultOptions(): RequestOptions {
    return this.#defaultOptions;
  }

  /**
   * Gets the fetch function used for making HTTP requests.
   */
  public get fetch(): Fetch {
    return this.#fetch;
  }

  /**
   * Sets the fetch function used for making HTTP requests.
   */
  public set fetch(value: Fetch) {
    this.#fetch = value;
  }

  /**
   * Gets the cache used for storing HTTP responses.
   */
  public get cache(): FetchClientCache {
    return this.#cache;
  }

  /**
   * Gets the access token used for authentication.
   */
  public get accessToken(): string | null {
    return this.#getAccessToken();
  }

  /**
   * Creates a new instance of FetchClient using the current provider.
   * @returns A new instance of FetchClient.
   */
  public getFetchClient(): FetchClient {
    return new FetchClient(this);
  }

  /**
   * Sets the function used for retrieving the access token.
   * @param accessTokenFunc - The function that retrieves the access token.
   */
  public setAccessTokenFunc(accessTokenFunc: () => string | null) {
    this.#getAccessToken = accessTokenFunc;
  }

  /**
   * Sets the default request options used for creating FetchClient instances.
   * @param options - The default request options.
   */
  public setDefaultRequestOptions(options: RequestOptions) {
    this.#defaultOptions = { ...this.#defaultOptions, ...options };
  }

  /**
   * Sets the default model validator function for all FetchClient instances created by this provider.
   * @param validate - The function that validates the model.
   */
  public setDefaultModelValidator(
    validate: (model: object | null) => Promise<ProblemDetails | null>,
  ) {
    this.#defaultOptions = {
      ...this.#defaultOptions,
      modelValidator: validate,
    };
  }

  /**
   * Sets the default base URL for all FetchClient instances created by this provider.
   * @param url - The URL to set as the default base URL.
   */
  public setDefaultBaseUrl(url: string) {
    this.#defaultOptions = { ...this.#defaultOptions, baseUrl: url };
  }

  /**
   * Adds a middleware to all FetchClient instances created by this provider.
   * @param middleware - The middleware function to be added.
   */
  public useMiddleware(middleware: FetchClientMiddleware) {
    this.#defaultOptions = {
      ...this.#defaultOptions,
      middleware: [...(this.#defaultOptions.middleware ?? []), middleware],
    };
  }
}

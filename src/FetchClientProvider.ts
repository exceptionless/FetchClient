import { FetchClient, type FetchClientOptions } from "./FetchClient.ts";
import { Counter } from "./Counter.ts";
import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import type { ProblemDetails } from "./ProblemDetails.ts";
import { FetchClientCache } from "./FetchClientCache.ts";

type Fetch = typeof globalThis.fetch;

/**
 * Represents a provider for creating instances of the FetchClient class with shared default options and cache.
 */
export class FetchClientProvider {
  #options: FetchClientOptions = {};
  #fetch?: Fetch;
  #cache: FetchClientCache;
  #counter = new Counter();

  /**
   * Creates a new instance of FetchClientProvider.
   * @param fetch - The fetch function to use. If not provided, the global fetch function will be used.
   */
  constructor(fetch?: Fetch) {
    this.#cache = new FetchClientCache();
    this.#fetch = fetch;
  }

  /**
   * Gets the fetch function used for making requests.
   */
  public get fetch(): Fetch | undefined {
    return this.#fetch;
  }

  /**
   * Sets the fetch function used for making requests.
   */
  public set fetch(value: Fetch) {
    this.#fetch = value;
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
   * Gets the options used for FetchClient instances.
   */
  public get options(): FetchClientOptions {
    return this.#options;
  }

  /**
   * Sets the options used for FetchClient instances.
   */
  public set options(value: FetchClientOptions) {
    this.#options = value;
  }

  /**
   * Gets the cache used for storing HTTP responses.
   */
  public get cache(): FetchClientCache {
    return this.#cache;
  }

  /**
   * Creates a new instance of FetchClient using the current provider.
   * @returns A new instance of FetchClient.
   */
  public getFetchClient(): FetchClient {
    return new FetchClient({
      defaultRequestOptions: this.#options.defaultRequestOptions,
      baseUrl: this.#options.baseUrl,
      cache: this.#cache,
      fetch: this.fetch,
      middleware: this.#options.middleware,
      modelValidator: this.#options.modelValidator,
      accessTokenFunc: this.#options.accessTokenFunc,
      providerCounter: this.#counter,
    });
  }

  /**
   * Applies the specified options by merging with the current options.
   */
  public applyOptions(options: FetchClientOptions) {
    this.#options = {
      ...this.#options,
      ...options,
    };
  }

  /**
   * Sets the function used for retrieving the access token.
   * @param accessTokenFunc - The function that retrieves the access token.
   */
  public setAccessTokenFunc(accessTokenFunc: () => string | null) {
    this.#options = {
      ...this.#options,
      accessTokenFunc: accessTokenFunc,
    };
  }

  /**
   * Sets the default model validator function for all FetchClient instances created by this provider.
   * @param validate - The function that validates the model.
   */
  public setDefaultModelValidator(
    validate: (model: object | null) => Promise<ProblemDetails | null>,
  ) {
    this.#options = {
      ...this.#options,
      modelValidator: validate,
    };
  }

  /**
   * Sets the default base URL for all FetchClient instances created by this provider.
   * @param url - The URL to set as the default base URL.
   */
  public setDefaultBaseUrl(url: string) {
    this.#options = {
      ...this.#options,
      baseUrl: url,
    };
  }

  /**
   * Adds a middleware to all FetchClient instances created by this provider.
   * @param middleware - The middleware function to be added.
   */
  public useMiddleware(middleware: FetchClientMiddleware) {
    this.#options = {
      ...this.#options,
      middleware: [
        ...(this.#options.middleware ?? []),
        middleware,
      ],
    };
  }
}

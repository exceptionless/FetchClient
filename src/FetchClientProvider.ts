import { FetchClient } from "./FetchClient.ts";
import { Counter } from "./Counter.ts";
import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import type { ProblemDetails } from "./ProblemDetails.ts";
import { FetchClientCache } from "./FetchClientCache.ts";
import type { FetchClientOptions } from "./FetchClientOptions.ts";

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
    if (fetch) {
      this.#fetch = fetch;
    }

    this.#options = {
      cache: this.#cache,
      providerCounter: this.#counter,
      fetch: this.#fetch,
    };
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
  public set fetch(value: Fetch | undefined) {
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
   * Gets the counter used for tracking ongoing requests.
   */
  public get counter(): Counter {
    return this.#counter;
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
   * @param options - The options to use for the FetchClient instance.
   * @returns A new instance of FetchClient.
   */
  public getFetchClient(options?: FetchClientOptions): FetchClient {
    if (options) {
      options = {
        ...this.#options,
        ...options,
      };
      options.provider = this;

      return new FetchClient(options);
    }

    return new FetchClient(this);
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
  public setModelValidator(
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
  public setBaseUrl(url: string) {
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

const provider = new FetchClientProvider();
export const defaultInstance: FetchClientProvider = provider;

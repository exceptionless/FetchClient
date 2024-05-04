import { Counter } from "./Counter.ts";
import type { GetRequestOptions, RequestOptions } from "./RequestOptions.ts";
import { ProblemDetails } from "./ProblemDetails.ts";
import type { FetchClientResponse } from "./FetchClientResponse.ts";
import type { FetchClientMiddleware, Next } from "./FetchClientMiddleware.ts";
import type { FetchClientContext } from "./FetchClientContext.ts";
import { parseLinkHeader } from "./LinkHeader.ts";
import { FetchClientProvider } from "./FetchClientProvider.ts";

type Fetch = typeof globalThis.fetch;

/**
 * Represents a client for making HTTP requests using the Fetch API.
 */
export class FetchClient {
  #provider: FetchClientProvider;
  #middleware: FetchClientMiddleware[] = [];
  #counter = new Counter();

  /**
   * Represents a FetchClient that handles HTTP requests using the Fetch API.
   * @param fetch - An optional Fetch implementation to use for making HTTP requests. If not provided, the global `fetch` function will be used.
   */
  constructor(fetchOrProvider?: Fetch | FetchClientProvider) {
    if (fetchOrProvider instanceof FetchClientProvider) {
      this.#provider = fetchOrProvider;
    } else {
      this.#provider = new FetchClientProvider(fetchOrProvider);
    }
  }

  /**
   * Gets the number of inflight requests for this FetchClient instance.
   */
  public get provider(): FetchClientProvider {
    return this.#provider;
  }

  /**
   * Gets the number of inflight requests for this FetchClient instance.
   */
  public get requestCount(): number {
    return this.#counter.count;
  }

  /**
   * Gets a value indicating whether the client is currently loading.
   * @returns {boolean} A boolean value indicating whether the client is loading.
   */
  public get loading(): boolean {
    return this.requestCount > 0;
  }

  /**
   * Adds one or more middleware functions to the FetchClient's middleware pipeline.
   * Middleware functions are executed in the order they are added.
   *
   * @param mw - The middleware functions to add.
   */
  public use(...mw: FetchClientMiddleware[]): void {
    this.#middleware.push(...mw);
  }

  /**
   * Sends a GET request to the specified URL.
   *
   * @param url - The URL to send the GET request to.
   * @param options - The optional request options.
   * @returns A promise that resolves to the response of the GET request.
   */
  async get(
    url: string,
    options?: GetRequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...this.#provider.defaultOptions, ...options };
    const response = await this.fetchInternal(
      url,
      options,
      {
        method: "GET",
        headers: {
          ...{ "Content-Type": "application/json" },
          ...options?.headers,
        },
      },
    );

    return response;
  }

  /**
   * Sends a GET request to the specified URL and returns the response as JSON.
   * @param url - The URL to send the GET request to.
   * @param options - Optional request options.
   * @returns A promise that resolves to the response as JSON.
   */
  getJSON<T>(
    url: string,
    options?: GetRequestOptions,
  ): Promise<FetchClientResponse<T>> {
    return this.get(url, options) as Promise<FetchClientResponse<T>>;
  }

  /**
   * Sends a POST request to the specified URL.
   *
   * @param url - The URL to send the request to.
   * @param body - The request body, can be an object or a string.
   * @param options - Additional options for the request.
   * @returns A promise that resolves to a FetchClientResponse object.
   */
  async post(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...this.#provider.defaultOptions, ...options };
    const problem = await this.validate(body, options);
    if (problem) return this.problemToResponse(problem, url);

    const response = await this.fetchInternal(
      url,
      options,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      },
    );

    return response;
  }

  /**
   * Sends a POST request with form data to the specified URL.
   *
   * @param url - The URL to send the request to.
   * @param formData - The form data to include in the request body.
   * @param options - The optional request options.
   * @returns A promise that resolves to the response of the request.
   */
  async postForm(
    url: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...this.#provider.defaultOptions, ...options };
    const response = await this.fetchInternal(
      url,
      options,
      {
        method: "POST",
        headers: { ...options?.headers },
        body: formData,
      },
    );

    return response;
  }

  /**
   * Sends a POST request with JSON payload to the specified URL.
   *
   * @template T - The type of the response data.
   * @param {string} url - The URL to send the request to.
   * @param {object | string} [body] - The JSON payload to send with the request.
   * @param {RequestOptions} [options] - Additional options for the request.
   * @returns {Promise<FetchClientResponse<T>>} - A promise that resolves to the response data.
   */
  postJSON<T>(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<T>> {
    return this.post(url, body, options) as Promise<FetchClientResponse<T>>;
  }

  /**
   * Sends a PUT request to the specified URL with the given body and options.
   * @param url - The URL to send the request to.
   * @param body - The request body, can be an object or a string.
   * @param options - The request options.
   * @returns A promise that resolves to a FetchClientResponse object.
   */
  async put(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...this.#provider.defaultOptions, ...options };
    const problem = await this.validate(body, options);
    if (problem) return this.problemToResponse(problem, url);

    const response = await this.fetchInternal(
      url,
      options,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      },
    );

    return response;
  }

  /**
   * Sends a PUT request with JSON payload to the specified URL.
   *
   * @template T - The type of the response data.
   * @param {string} url - The URL to send the request to.
   * @param {object | string} [body] - The JSON payload to send with the request.
   * @param {RequestOptions} [options] - Additional options for the request.
   * @returns {Promise<FetchClientResponse<T>>} - A promise that resolves to the response data.
   */
  putJSON<T>(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<T>> {
    return this.put(url, body, options) as Promise<FetchClientResponse<T>>;
  }

  /**
   * Sends a PATCH request to the specified URL with the provided body and options.
   * @param url - The URL to send the PATCH request to.
   * @param body - The body of the request. It can be an object or a string.
   * @param options - The options for the request.
   * @returns A Promise that resolves to the response of the PATCH request.
   */
  async patch(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<Response> {
    options = { ...this.#provider.defaultOptions, ...options };
    const problem = await this.validate(body, options);
    if (problem) return this.problemToResponse(problem, url);

    const response = await this.fetchInternal(
      url,
      options,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      },
    );

    return response;
  }

  /**
   * Sends a PATCH request with JSON payload to the specified URL.
   *
   * @template T - The type of the response data.
   * @param {string} url - The URL to send the request to.
   * @param {object | string} [body] - The JSON payload to send with the request.
   * @param {RequestOptions} [options] - Additional options for the request.
   * @returns {Promise<FetchClientResponse<T>>} - A promise that resolves to the response data.
   */
  patchJSON<T>(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<T>> {
    return this.patch(url, body, options) as Promise<FetchClientResponse<T>>;
  }

  /**
   * Sends a DELETE request to the specified URL.
   *
   * @param url - The URL to send the DELETE request to.
   * @param options - The options for the request.
   * @returns A promise that resolves to a `FetchClientResponse` object.
   */
  async delete(
    url: string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...this.#provider.defaultOptions, ...options };
    return await this.fetchInternal(
      url,
      options,
      {
        method: "DELETE",
        headers: options?.headers ?? {},
      },
    );
  }

  private async validate(
    data: unknown,
    options?: RequestOptions,
  ): Promise<ProblemDetails | null> {
    if (
      typeof data !== "object" ||
      (options && options.shouldValidateModel === false)
    ) return null;

    if (options?.modelValidator === undefined) {
      return null;
    }

    const problem = await options.modelValidator(data as object);
    if (!problem) return null;

    return problem;
  }

  private async fetchInternal<T>(
    url: string,
    options: RequestOptions,
    init?: RequestInit,
  ): Promise<FetchClientResponse<T>> {
    url = this.buildUrl(url, options);

    const accessToken = this.#provider.accessToken;
    if (accessToken !== null) {
      init = {
        ...init,
        ...{
          headers: { ...init?.headers, Authorization: `Bearer ${accessToken}` },
        },
      };
    }

    if (options?.signal) {
      init = { ...init, signal: options.signal };
    }

    const fetchMiddleware = async (ctx: FetchClientContext, next: Next) => {
      const getOptions = options as GetRequestOptions;
      if (getOptions?.cacheKey) {
        const cachedResponse = this.#provider.cache.get(getOptions.cacheKey);
        if (cachedResponse) {
          ctx.response = cachedResponse as FetchClientResponse<T>;
          return;
        }
      }

      const response = await this.#provider.fetch(ctx.request);
      if (
        ctx.request.headers.get("Content-Type")?.startsWith(
          "application/json",
        ) ||
        ctx.request.headers.get("Accept")?.startsWith("application/json") ||
        response?.headers.get("Content-Type")?.startsWith(
          "application/problem+json",
        )
      ) {
        ctx.response = await this.getJSONResponse<T>(response);
      } else {
        ctx.response = response as FetchClientResponse<T>;
        ctx.response.data = null;
        ctx.response.problem = new ProblemDetails();
      }

      ctx.response.meta = {
        links: parseLinkHeader(response.headers.get("Link")) || {},
      };

      if (getOptions?.cacheKey) {
        this.#provider.cache.set(
          getOptions.cacheKey,
          ctx.response,
          getOptions.cacheDuration,
        );
      }

      await next();
    };
    const middleware = [
      ...this.#middleware,
      ...(options?.middleware ?? []),
      fetchMiddleware,
    ];

    this.#counter.increment();
    this.#provider.counter.increment();

    const context: FetchClientContext = {
      options,
      request: new Request(url, init),
      response: null,
      data: {},
    };
    await this.invokeMiddleware(context, middleware);

    this.#counter.decrement();
    this.#provider.counter.decrement();

    this.validateResponse(context.response, options);

    return context.response as FetchClientResponse<T>;
  }

  private async invokeMiddleware(
    context: FetchClientContext,
    middleware: FetchClientMiddleware[],
  ): Promise<void> {
    if (!middleware.length) return;

    const mw = middleware[0];

    return await mw(context, async () => {
      await this.invokeMiddleware(context, middleware.slice(1));
    });
  }

  private async getJSONResponse<T>(
    response: Response,
  ): Promise<FetchClientResponse<T>> {
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = new ProblemDetails();
      data.setErrorMessage("Unable to deserialize response data");
    }

    const jsonResponse = response as FetchClientResponse<T>;

    if (
      !response.ok ||
      response.headers.get("Content-Type")?.startsWith(
        "application/problem+json",
      )
    ) {
      jsonResponse.problem = data as ProblemDetails;
      jsonResponse.data = null;
      return jsonResponse;
    }

    jsonResponse.problem = new ProblemDetails();
    jsonResponse.data = data;

    return jsonResponse;
  }

  private problemToResponse(
    problem: ProblemDetails,
    url: string,
  ): FetchClientResponse<unknown> {
    const headers = new Headers();
    headers.set("Content-Type", "application/problem+json");

    return {
      url,
      status: 422,
      statusText: "Unprocessable Entity",
      body: null,
      bodyUsed: true,
      ok: false,
      headers: headers,
      redirected: false,
      problem: problem,
      data: null,
      meta: { links: {} },
      type: "basic",
      json: () => new Promise((resolve) => resolve(problem)),
      text: () => new Promise((resolve) => resolve(JSON.stringify(problem))),
      arrayBuffer: () => new Promise((resolve) => resolve(new ArrayBuffer(0))),
      blob: () => new Promise((resolve) => resolve(new Blob())),
      formData: () => new Promise((resolve) => resolve(new FormData())),
      clone: () => {
        throw new Error("Not implemented");
      },
    };
  }

  private buildUrl(url: string, options: RequestOptions | undefined): string {
    const isAbsoluteUrl = url.startsWith("http");

    if (url.startsWith("/")) {
      url = url.substring(1);
    }

    if (!url.startsWith("http") && options?.baseUrl) {
      url = options.baseUrl + "/" + url;
    }

    const origin = isAbsoluteUrl ? undefined : window.location.origin ?? "";
    const parsed = new URL(url, origin);

    if (options?.params) {
      for (const [key, value] of Object.entries(options?.params)) {
        if (value !== undefined && value !== null) {
          parsed.searchParams.append(key, value as string);
        }
      }

      url = parsed.toString();
    }

    return isAbsoluteUrl ? url : `${parsed.pathname}${parsed.search}`;
  }

  private validateResponse(
    response: Response | null,
    options: RequestOptions | undefined,
  ) {
    if (!response) {
      throw new Error("Response is null");
    }

    if (response.ok) {
      return;
    }

    if (
      options?.expectedStatusCodes &&
      options.expectedStatusCodes.includes(response.status)
    ) {
      return;
    }

    if (options?.errorCallback) {
      options.errorCallback(response);
    }

    throw response;
  }
}

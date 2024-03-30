import { Counter } from "./Counter.ts";
import type { RequestOptions } from "./RequestOptions.ts";
import { ProblemDetails } from "./ProblemDetails.ts";
import type { FetchClientResponse } from "./FetchClientResponse.ts";
import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import type { FetchClientContext } from "./FetchClientContext.ts";
import { parseLinkHeader } from "./LinkHeader.ts";

type Fetch = typeof globalThis.fetch;

let defaultOptions: RequestOptions = {
  baseUrl: "api",
};

const globalRequestCount = new Counter((count) => globalLoading = count > 0);
export let globalLoading: boolean = false;

let getAccessToken: () => string | null = () => null;
export function setAccessTokenFunc(accessTokenFunc: () => string | null) {
  getAccessToken = accessTokenFunc;
}

export function setDefaultRequestOptions(options: RequestOptions) {
  defaultOptions = { ...defaultOptions, ...options };
}

export function setDefaultModelValidator(
  validate: (model: object | null) => Promise<ProblemDetails | null>,
) {
  defaultOptions = { ...defaultOptions, modelValidator: validate };
}

export function setDefaultBaseUrl(url: string) {
  defaultOptions = { ...defaultOptions, baseUrl: url };
}

export function useGlobalMiddleware(middleware: FetchClientMiddleware) {
  defaultOptions = {
    ...defaultOptions,
    middleware: [...(defaultOptions.middleware ?? []), middleware],
  };
}

export class FetchClient {
  private fetch: Fetch;
  private middleware: FetchClientMiddleware[] = [];
  private _requestCount = new Counter();

  constructor(fetch?: Fetch) {
    if (fetch) {
      this.fetch = fetch;
    } else {
      this.fetch = globalThis.fetch;
    }
  }

  public get requestCount(): number {
    return this._requestCount.count;
  }

  public get loading(): boolean {
    return this.requestCount > 0;
  }

  public use(...mw: FetchClientMiddleware[]): void {
    this.middleware.push(...mw);
  }

  async get(
    url: string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...defaultOptions, ...options };
    const response = await this.fetchInternal(
      url,
      {
        method: "GET",
        headers: {
          ...{ "Content-Type": "application/json" },
          ...options?.headers,
        },
      },
      options,
    );

    return response;
  }

  getJSON<T>(
    url: string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<T>> {
    return this.get(url, options) as Promise<FetchClientResponse<T>>;
  }

  async post(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...defaultOptions, ...options };
    const problem = await this.validate(body, options);
    if (problem) return this.problemToResponse(problem, url);

    const response = await this.fetchInternal(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      },
      options,
    );

    return response;
  }

  async postForm(
    url: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...defaultOptions, ...options };
    const response = await this.fetchInternal(
      url,
      {
        method: "POST",
        headers: { ...options?.headers },
        body: formData,
      },
      options,
    );

    return response;
  }

  postJSON<T>(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<T>> {
    return this.post(url, body, options) as Promise<FetchClientResponse<T>>;
  }

  async put(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...defaultOptions, ...options };
    const problem = await this.validate(body, options);
    if (problem) return this.problemToResponse(problem, url);

    const response = await this.fetchInternal(
      url,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      },
      options,
    );

    return response;
  }

  putJSON<T>(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<T>> {
    return this.put(url, body, options) as Promise<FetchClientResponse<T>>;
  }

  async patch(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<Response> {
    options = { ...defaultOptions, ...options };
    const problem = await this.validate(body, options);
    if (problem) return this.problemToResponse(problem, url);

    const response = await this.fetchInternal(
      url,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      },
      options,
    );

    return response;
  }

  patchJSON<T>(
    url: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<T>> {
    return this.patch(url, body, options) as Promise<FetchClientResponse<T>>;
  }

  async delete(
    url: string,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<unknown>> {
    options = { ...defaultOptions, ...options };
    return await this.fetchInternal(
      url,
      {
        method: "DELETE",
        headers: options?.headers ?? {},
      },
      options,
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
    init?: RequestInit,
    options?: RequestOptions,
  ): Promise<FetchClientResponse<T>> {
    url = this.buildUrl(url, options);

    const accessToken = getAccessToken();
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
      const response = await this.fetch(ctx.request);
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

      await next();
    };
    const middleware = [
      ...this.middleware,
      ...(options?.middleware ?? []),
      fetchMiddleware,
    ];

    globalRequestCount.increment();
    this._requestCount.increment();

    const context: FetchClientContext = {
      request: new Request(url, init),
      response: null,
      data: {},
    };
    await this.invokeMiddleware(context, middleware);

    this._requestCount.decrement();
    globalRequestCount.decrement();

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

export type Next = () => Promise<void>;

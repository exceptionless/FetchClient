import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import type { ProblemDetails } from "./ProblemDetails.ts";
import type { CacheKey } from "./FetchClientCache.ts";

/**
 * Represents the options for making a request using the FetchClient.
 */
export type RequestOptions = {
  /**
   * The base URL for the request.
   */
  baseUrl?: string;

  /**
   * Specifies whether the model should be validated before making the request.
   */
  shouldValidateModel?: boolean;

  /**
   * A function that validates the model before making the request.
   * Returns a Promise that resolves to a ProblemDetails object if validation fails, or null if validation succeeds.
   */
  modelValidator?: (model: object | null) => Promise<ProblemDetails | null>;

  /**
   * Additional parameters to be included in the request.
   */
  params?: Record<string, unknown>;

  /**
   * The expected status codes for the response.
   */
  expectedStatusCodes?: number[];

  /**
   * Additional headers to be included in the request.
   */
  headers?: Record<string, string>;

  /**
   * A callback function to handle errors that occur during the request.
   */
  errorCallback?: (error: Response) => void;

  /**
   * An array of middleware functions to be applied to the request.
   */
  middleware?: FetchClientMiddleware[];

  /**
   * An AbortSignal object that can be used to cancel the request.
   */
  signal?: AbortSignal;
};

export type GetRequestOptions = RequestOptions & {
  cacheKey?: CacheKey;
  cacheDuration?: number;
};

import type { CacheKey } from "./FetchClientCache.ts";

/**
 * Represents the options for making a request using the FetchClient.
 */
export type RequestOptions = {
  /**
   * Specifies whether the model should be validated before making the request.
   */
  shouldValidateModel?: boolean;

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
   * An AbortSignal object that can be used to cancel the request.
   */
  signal?: AbortSignal;

  /**
   * Any additional metadata to be used during the request and middleware.
   */
  meta?: Record<string, unknown>;
};

/**
 * Represents the options for a GET request.
 */
export type GetRequestOptions = RequestOptions & {
  /**
   * The cache key for the request.
   */
  cacheKey?: CacheKey;

  /**
   * The duration for which the response should be cached, in milliseconds.
   */
  cacheDuration?: number;
};

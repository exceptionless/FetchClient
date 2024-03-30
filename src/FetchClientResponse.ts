import type { Link, Links } from "./LinkHeader.ts";
import type { ProblemDetails } from "./ProblemDetails.ts";

/**
 * Represents a response from the FetchClient.
 * @template T - The type of the response data.
 */
export type FetchClientResponse<T> = Response & {
  /**
   * The response data.
   */
  data: T | null;
  /**
   * Details about any problem that occurred during the request.
   */
  problem: ProblemDetails;
  /**
   * Additional metadata associated with the response.
   */
  meta: Record<string, unknown> & {
    /**
     * Links associated with the response.
     */
    links: Links & { next?: Link; previous?: Link };
  };
};

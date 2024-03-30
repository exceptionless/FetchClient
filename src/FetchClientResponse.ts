import type { Link, Links } from "./LinkHeader.ts";
import type { ProblemDetails } from "./ProblemDetails.ts";

export type FetchClientResponse<T> = Response & {
  data: T | null;
  problem: ProblemDetails;
  meta: Record<string, unknown> & {
    links: Links & { next?: Link; previous?: Link };
  };
};

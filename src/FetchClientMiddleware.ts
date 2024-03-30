import type { Next } from "./FetchClient.ts";
import type { FetchClientContext } from "./FetchClientContext.ts";

export type FetchClientMiddleware = (
  context: FetchClientContext,
  next: Next,
) => Promise<void>;

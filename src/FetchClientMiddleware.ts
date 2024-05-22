import type { FetchClientContext } from "./FetchClientContext.ts";

/**
 * Represents a middleware function for the FetchClient.
 * @param context - The context object containing information about the request.
 * @param next - The next function to be called in the middleware chain.
 * @returns A Promise that resolves when the middleware has completed its operation.
 */
export type FetchClientMiddleware = (
  context: FetchClientContext,
  next: () => Promise<void>,
) => Promise<void>;

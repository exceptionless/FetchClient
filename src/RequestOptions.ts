import type { FetchClientMiddleware } from "./FetchClientMiddleware.ts";
import type { ProblemDetails } from "./ProblemDetails.ts";

export type RequestOptions = {
  baseUrl?: string;
  shouldValidateModel?: boolean;
  modelValidator?: (model: object | null) => Promise<ProblemDetails | null>;
  params?: Record<string, unknown>;
  expectedStatusCodes?: number[];
  headers?: Record<string, string>;
  errorCallback?: (error: Response) => void;
  middleware?: FetchClientMiddleware[];
  signal?: AbortSignal;
};

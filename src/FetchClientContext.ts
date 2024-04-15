import type { FetchClientResponse } from "./FetchClientResponse.ts";
import type { RequestOptions } from "./RequestOptions.ts";

export type FetchClientContext = {
  options: RequestOptions;
  request: Request;
  response: FetchClientResponse<unknown> | null;
  data: Record<string, unknown>;
};

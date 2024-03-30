import type { FetchClientResponse } from "./FetchClientResponse.ts";

export type FetchClientContext = {
  request: Request;
  response: FetchClientResponse<unknown> | null;
  data: Record<string, unknown>;
};

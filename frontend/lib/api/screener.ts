/**
 * Screener API service.
 *
 * POST /api/v1/screener/query — AI-powered stock screener with structured
 * filters and optional natural-language queries.
 */

import { apiClient } from "../api";
import type { ScreenerRequest, ScreenerResponse } from "../types";

/** Run a screener query with optional filters and NL prompt. */
export async function queryScreener(
  body: ScreenerRequest = {},
): Promise<ScreenerResponse> {
  return apiClient.post<ScreenerResponse>("/screener/query", body);
}

/**
 * Market Movers (Gainers & Losers) API service.
 *
 * GET /api/v1/companies/movers/list?period=1D&direction=gainers&limit=10
 */

import { apiClient } from "../api";
import type { MoversResponse } from "../types";

/** Fetch top gainers or losers over a specific period (1D, 1W, 1M, 3M, 6M, 1Y). */
export async function getMovers(
  period: string = "1D",
  direction?: string,
  limit: number = 10
): Promise<MoversResponse> {
  return apiClient.get<MoversResponse>("/companies/movers/list", {
    params: { period, direction, limit },
  });
}

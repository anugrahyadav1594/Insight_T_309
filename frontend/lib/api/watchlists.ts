/**
 * Watchlist API service.
 *
 * All endpoints require authentication.
 */

import { apiClient } from "../api";
import type {
  WatchlistCreate,
  WatchlistOut,
  WatchlistListResponse,
  WatchlistDetail,
  EnrichedItem,
} from "../types";

/** List all watchlists for the current user. */
export async function listWatchlists(): Promise<WatchlistListResponse> {
  return apiClient.get<WatchlistListResponse>("/watchlists");
}

/** Create a new watchlist. */
export async function createWatchlist(
  body: WatchlistCreate = {},
): Promise<WatchlistOut> {
  return apiClient.post<WatchlistOut>("/watchlists", body);
}

/** Get a watchlist with all its enriched items. */
export async function getWatchlist(
  watchlistId: string,
): Promise<WatchlistDetail> {
  return apiClient.get<WatchlistDetail>(`/watchlists/${watchlistId}`);
}

/** Add a ticker to a watchlist. */
export async function addWatchlistItem(
  watchlistId: string,
  ticker: string,
): Promise<EnrichedItem> {
  return apiClient.post<EnrichedItem>(`/watchlists/${watchlistId}/items`, {
    ticker,
  });
}

/** Remove a ticker from a watchlist. */
export async function removeWatchlistItem(
  watchlistId: string,
  ticker: string,
): Promise<void> {
  return apiClient.delete(`/watchlists/${watchlistId}/items/${ticker}`);
}

/**
 * IPO Calendar API service.
 *
 * GET /api/v1/ipos → IPO calendar split into ongoing, upcoming, and ended segments.
 */

import { apiClient } from "../api";
import type { IpoCalendarResponse } from "../types";

/** Fetch the IPO calendar. */
export async function getIpoCalendar(): Promise<IpoCalendarResponse> {
  return apiClient.get<IpoCalendarResponse>("/ipos");
}

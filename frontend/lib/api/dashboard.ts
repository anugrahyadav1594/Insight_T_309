/**
 * Dashboard API service.
 *
 * GET /api/v1/dashboard → aggregated dashboard data.
 */

import { apiClient } from "../api";
import type { DashboardResponse } from "../types";

/** Fetch the authenticated user's aggregated dashboard. */
export async function getDashboard(): Promise<DashboardResponse> {
  return apiClient.get<DashboardResponse>("/dashboard");
}

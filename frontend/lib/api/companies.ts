/**
 * Company Search & Analysis API service.
 *
 * GET /api/v1/companies/search?q=... -> Search companies by ticker/name
 * GET /api/v1/companies/{ticker}     -> Full company financial analysis & scores
 */

import { apiClient } from "../api";
import type { CompanySearchResponse, CompanyAnalysisResponse } from "../types";

/** Search companies by symbol/name query. */
export async function searchCompanies(
  query: string,
  limit: number = 10,
  exchange?: string
): Promise<CompanySearchResponse> {
  return apiClient.get<CompanySearchResponse>("/companies/search", {
    params: { q: query, limit, exchange },
  });
}

/** Get full financial analysis, raw metrics, scores, and AI insights for a ticker. */
export async function getCompanyAnalysis(ticker: string): Promise<CompanyAnalysisResponse> {
  return apiClient.get<CompanyAnalysisResponse>(`/companies/${ticker}`);
}

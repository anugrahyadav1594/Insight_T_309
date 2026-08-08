/**
 * Portfolio API service.
 *
 * All endpoints require authentication.
 */

import { apiClient } from "../api";
import type {
  PortfolioCreate,
  PortfolioOut,
  PortfolioDetail,
  PortfolioListResponse,
  HoldingCreate,
  HoldingUpdate,
  HoldingOut,
  PortfolioAnalysisResponse,
} from "../types";

/** List all portfolios for the current user. */
export async function listPortfolios(): Promise<PortfolioListResponse> {
  return apiClient.get<PortfolioListResponse>("/portfolios");
}

/** Create a new portfolio. */
export async function createPortfolio(
  body: PortfolioCreate,
): Promise<PortfolioOut> {
  return apiClient.post<PortfolioOut>("/portfolios", body);
}

/** Get a single portfolio with its holdings and scores. */
export async function getPortfolio(
  portfolioId: string,
): Promise<PortfolioDetail> {
  return apiClient.get<PortfolioDetail>(`/portfolios/${portfolioId}`);
}

/** Add a holding to a portfolio. */
export async function addHolding(
  portfolioId: string,
  body: HoldingCreate,
): Promise<HoldingOut> {
  return apiClient.post<HoldingOut>(
    `/portfolios/${portfolioId}/holdings`,
    body,
  );
}

/** Update an existing holding (quantity and/or average buy price). */
export async function updateHolding(
  portfolioId: string,
  holdingId: string,
  body: HoldingUpdate,
): Promise<HoldingOut> {
  return apiClient.put<HoldingOut>(
    `/portfolios/${portfolioId}/holdings/${holdingId}`,
    body,
  );
}

/** Delete a holding from a portfolio. */
export async function deleteHolding(
  portfolioId: string,
  holdingId: string,
): Promise<void> {
  return apiClient.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`);
}

/** Trigger an AI analysis of a portfolio. */
export async function analyzePortfolio(
  portfolioId: string,
  focus?: string | null,
): Promise<PortfolioAnalysisResponse> {
  return apiClient.post<PortfolioAnalysisResponse>(
    `/portfolios/${portfolioId}/analyze`,
    focus ? { focus } : undefined,
  );
}

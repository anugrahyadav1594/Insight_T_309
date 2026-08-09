import { apiClient } from "./api";
import type { PortfolioListResponse, PortfolioDetail, WhatIfHolding } from "./types";

export async function fetchPortfolios(): Promise<PortfolioListResponse> {
  return apiClient.get<PortfolioListResponse>("/portfolios");
}

export async function fetchPortfolioDetail(id: string): Promise<PortfolioDetail> {
  return apiClient.get<PortfolioDetail>(`/portfolios/${id}`);
}

export async function fetchWhatIf(id: string, changes: WhatIfHolding[]): Promise<PortfolioDetail> {
  return apiClient.post<PortfolioDetail>(`/portfolios/${id}/what-if`, { holdings: changes });
}
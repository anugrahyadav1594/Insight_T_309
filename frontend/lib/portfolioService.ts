import { apiClient } from "./api";
import type { PortfolioListResponse, PortfolioDetail, PortfolioOut, HoldingOut, WhatIfHolding } from "./types";

export const fetchPortfolios = () => apiClient.get<PortfolioListResponse>("/portfolios");
export const fetchPortfolioDetail = (id: string) => apiClient.get<PortfolioDetail>(`/portfolios/${id}`);
export const createPortfolio = (name: string, description?: string | null) =>
  apiClient.post<PortfolioOut>("/portfolios", { name, description });
export const addHolding = (portfolioId: string, ticker: string, quantity: number, averageBuyPrice: number) =>
  apiClient.post<HoldingOut>(`/portfolios/${portfolioId}/holdings`, { ticker, quantity, average_buy_price: averageBuyPrice });
export const runWhatIf = (portfolioId: string, changes: WhatIfHolding[]) =>
  apiClient.post<PortfolioDetail>(`/portfolios/${portfolioId}/what-if`, { holdings: changes });
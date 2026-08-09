import { apiClient } from "./api";
import type { PortfolioDetail, WhatIfHolding } from "./types";

export async function runWhatIf(
  portfolioId: string,
  changes: WhatIfHolding[],
): Promise<PortfolioDetail> {
  return apiClient.post<PortfolioDetail>(`/portfolios/${portfolioId}/what-if`, {
    holdings: changes,
  });
}
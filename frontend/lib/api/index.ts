/**
 * Barrel export for all API service modules.
 *
 * Usage:
 *   import { getDashboard, listPortfolios, queryScreener } from "@/lib/api";
 */

export { getDashboard } from "./dashboard";

export {
  listPortfolios,
  createPortfolio,
  getPortfolio,
  addHolding,
  updateHolding,
  deleteHolding,
  analyzePortfolio,
} from "./portfolios";

export {
  listWatchlists,
  createWatchlist,
  getWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
} from "./watchlists";

export { queryScreener } from "./screener";

export { chat } from "./ai";

export { getIpoCalendar } from "./ipos";

export { getMovers } from "./movers";

export { searchCompanies, getCompanyAnalysis, getCompanyNews } from "./companies";

/**
 * TypeScript interfaces mirroring the backend Pydantic schemas.
 *
 * Field names use snake_case to match the JSON wire format from FastAPI.
 * All optional fields align with Pydantic `| None` defaults.
 */

// ─── Common / Envelope ───────────────────────────────────────────────────────

export interface ErrorDetail {
  code: string;
  message: string;
  details?: unknown;
  request_id?: string;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ErrorEnvelope {
  success: false;
  error: ErrorDetail;
}

export type ApiResponse<T> = SuccessEnvelope<T> | ErrorEnvelope;

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface UserOut {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: UserOut | null;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface MeResponse {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export type RecommendationLabel =
  | "STRONG_BUY"
  | "BUY"
  | "HOLD"
  | "NEUTRAL"
  | "BEARISH";

export interface EngineScoreResult {
  score: number;
  breakdown: Record<string, number>;
  confidence: number;
  warnings?: string[];
}

export interface FundamentalScore extends EngineScoreResult {}
export interface TechnicalScore extends EngineScoreResult {}
export interface RiskScore extends EngineScoreResult {}

export interface OverallScore {
  score: number;
  fundamental: number;
  technical: number;
  risk: number;
  recommendation: RecommendationLabel;
  confidence: number;
}

// ─── AI / Explainability ─────────────────────────────────────────────────────

export type Impact = "positive" | "negative" | "neutral";

export interface SupportingMetric {
  metric: string;
  value: number;
  impact: Impact;
}

export interface SourceCitation {
  type: string;
  name: string;
  period?: string | null;
  provider?: string | null;
}

export interface Explainability {
  recommendation: string;
  confidence: number;
  reasoning: string;
  supporting_metrics: SupportingMetric[];
  risks: string[];
  positive_factors: string[];
  sources: SourceCitation[];
}

export interface AISummary {
  summary: string;
  strengths: string[];
  risks: string[];
  opportunities: string[];
  reasoning: string;
  supporting_metrics: SupportingMetric[];
}

// ─── Company ─────────────────────────────────────────────────────────────────

export interface CompanyIdentityOnly {
  ticker: string;
  name: string;
  exchange: string;
  sector?: string | null;
  industry?: string | null;
}

export interface CompanySearchHit {
  ticker: string;
  name: string;
  exchange: string;
  sector?: string | null;
  industry?: string | null;
  market_cap?: number | null;
}

export interface CompanySearchResponse {
  query: string;
  total: number;
  items: CompanySearchHit[];
}

export interface IdentityOut {
  name: string;
  exchange: string;
  sector?: string | null;
  industry?: string | null;
  description?: string | null;
}

export interface RawDataOut {
  price: number;
  previous_close?: number | null;
  day_change?: number | null;
  day_change_pct?: number | null;
  volume?: number | null;
  avg_volume?: number | null;
  market_cap?: number | null;
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  ps_ratio?: number | null;
  ev_ebitda?: number | null;
  roe?: number | null;
  roa?: number | null;
  gross_margin?: number | null;
  operating_margin?: number | null;
  net_margin?: number | null;
  revenue?: number | null;
  revenue_growth?: number | null;
  net_income?: number | null;
  eps?: number | null;
  eps_growth?: number | null;
  debt_to_equity?: number | null;
  current_ratio?: number | null;
  free_cash_flow?: number | null;
  dividend_yield?: number | null;
  beta?: number | null;
  high_52w?: number | null;
  low_52w?: number | null;
  volatility_30d?: number | null;
}

export interface CalculatedMetricsOut {
  revenue_growth?: number | null;
  eps_growth?: number | null;
  gross_margin?: number | null;
  operating_margin?: number | null;
  net_margin?: number | null;
  free_cash_flow?: number | null;
  roe?: number | null;
  roa?: number | null;
  debt_to_equity?: number | null;
  current_ratio?: number | null;
  interest_coverage?: number | null;
  fcf_yield?: number | null;
  quick_ratio?: number | null;
  position_52w?: number | null;
  ma20_slope?: number | null;
  ma50_slope?: number | null;
  ma200_slope?: number | null;
  price_vs_ma20?: number | null;
  price_vs_ma50?: number | null;
  price_vs_ma200?: number | null;
  rsi_14?: number | null;
  momentum_3m?: number | null;
  volume_ratio?: number | null;
  volatility_30d?: number | null;
  max_drawdown_1y?: number | null;
}

export interface ScoresOut {
  fundamental: FundamentalScore;
  technical: TechnicalScore;
  risk: RiskScore;
  overall: OverallScore;
}

export interface AnalysisResponse {
  ticker: string;
  identity: IdentityOut;
  raw_data: RawDataOut;
  calculated_metrics: CalculatedMetricsOut;
  scores: ScoresOut;
  ai: AISummary;
  data_as_of: string;
  source: string;
  stale: boolean;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface RiskHealth {
  score: number;
  label: string;
  top_risks: string[];
}

export interface WatchlistAlert {
  ticker: string;
  signal: string;
  reason: string;
  at: string;
}

export interface WatchlistSummary {
  count: number;
  alerts: WatchlistAlert[];
}

export interface FeaturedInsight {
  ticker: string;
  name: string;
  overall_score: number;
  recommendation: string;
  confidence: number;
  ai_summary: string;
}

export interface Signal {
  ticker: string;
  action: string;
  score: number;
  confidence: number;
  driver: string;
}

export interface DashboardResponse {
  portfolio_summary: PortfolioSummary;
  portfolio_scores: PortfolioScores;
  risk_health: RiskHealth;
  watchlist: WatchlistSummary;
  featured_insight?: FeaturedInsight | null;
  signals: Signal[];
  generated_at: string;
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

export interface PortfolioCreate {
  name: string;
  description?: string | null;
}

export interface PortfolioOut {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface HoldingCreate {
  ticker: string;
  quantity: number;
  average_buy_price: number;
}

export interface HoldingUpdate {
  quantity?: number | null;
  average_buy_price?: number | null;
}

export interface PortfolioSummary {
  portfolio_count: number;
  total_value: number;
  total_invested: number;
  total_pl: number;
  total_pl_pct: number;
  holdings_count: number;
}

export interface SectorConcentration {
  sector: string;
  weight: number;
}

export interface PortfolioScores {
  fundamental?: number | null;
  technical?: number | null;
  risk?: number | null;
  overall?: number | null;
  confidence: number;
}

export interface HoldingOut {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  average_buy_price: number;
  price?: number | null;
  invested_value: number;
  current_value: number;
  pnl: number;
  pnl_pct: number;
  weight: number;
  overall_score?: number | null;
  recommendation?: string | null;
}

export interface PortfolioDetail {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  summary: PortfolioSummary;
  sector_concentration: SectorConcentration[];
  scores: PortfolioScores;
  holdings: HoldingOut[];
}

export interface PortfolioListItem {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  summary: PortfolioSummary;
}

export interface PortfolioListResponse {
  items: PortfolioListItem[];
  total: number;
}

export interface PortfolioAnalyzeRequest {
  focus?: string | null;
}

// ─── Portfolio AI Analysis ───────────────────────────────────────────────────

export interface ConcentrationRisk {
  sector: string;
  weight: number;
  note: string;
}

export interface PortfolioAnalysisResponse {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  concentration_risks: ConcentrationRisk[];
  concerns: string[];
  opportunities: string[];
  explanation: string;
  scores: Record<string, number>;
  disclaimer: string;
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export interface WatchlistCreate {
  name?: string;
}

export interface WatchlistOut {
  id: string;
  name: string;
  created_at: string;
}

export interface WatchlistListItem {
  id: string;
  name: string;
  item_count: number;
  created_at: string;
}

export interface WatchlistListResponse {
  items: WatchlistListItem[];
  total: number;
}

export interface EnrichedItem {
  company: CompanyIdentityOnly;
  price?: number | null;
  day_change_pct?: number | null;
  signal?: string | null;
  score?: number | null;
  confidence?: number | null;
}

export interface WatchlistDetail {
  id: string;
  name: string;
  items: EnrichedItem[];
}

export interface WatchlistItemAddRequest {
  ticker: string;
}

// ─── Screener ────────────────────────────────────────────────────────────────

export type SortField =
  | "overall_score"
  | "fundamental_score"
  | "technical_score"
  | "risk_score"
  | "market_cap"
  | "price"
  | "pe_ratio"
  | "roe"
  | "revenue_growth";

export type SortOrder = "asc" | "desc";

export interface ScreenerFilter {
  sector?: string | null;
  exchange?: string | null;
  market_cap_min?: number | null;
  market_cap_max?: number | null;
  pe_ratio_min?: number | null;
  pe_ratio_max?: number | null;
  roe_min?: number | null;
  roe_max?: number | null;
  revenue_growth_min?: number | null;
  revenue_growth_max?: number | null;
  debt_to_equity_min?: number | null;
  debt_to_equity_max?: number | null;
  fundamental_score_min?: number | null;
  fundamental_score_max?: number | null;
  technical_score_min?: number | null;
  technical_score_max?: number | null;
  risk_score_min?: number | null;
  risk_score_max?: number | null;
  overall_score_min?: number | null;
  overall_score_max?: number | null;
}

export interface ScreenerRequest {
  filters?: ScreenerFilter;
  natural_language?: string | null;
  sort_by?: SortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface ScreenerResultItem {
  rank: number;
  ticker: string;
  name: string;
  exchange: string;
  sector?: string | null;
  market_cap?: number | null;
  price?: number | null;
  fundamental_score: number;
  technical_score: number;
  risk_score: number;
  overall_score: number;
  recommendation?: string | null;
}

export interface ScreenerResponse {
  query_id: string;
  applied_filters: Record<string, unknown>;
  count: number;
  limit: number;
  offset: number;
  results: ScreenerResultItem[];
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────

export type ChatScope =
  | "company"
  | "portfolio"
  | "metric"
  | "comparison"
  | "general";

export interface ChatContext {
  company_ticker?: string | null;
  portfolio_id?: string | null;
  scope?: ChatScope;
  tickers?: string[];
}

export interface ChatRequest {
  conversation_id?: string | null;
  message: string;
  context?: ChatContext;
}

export interface ChatReplyResponse {
  conversation_id: string;
  reply: string;
  context_used: Record<string, unknown>;
  created_at: string;
}

// ─── IPO Calendar ────────────────────────────────────────────────────────────

export type IPOStatus = "ongoing" | "upcoming" | "ended";

export interface IpoItem {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  sector?: string | null;
  price_band_low?: number | null;
  price_band_high?: number | null;
  issue_size?: number | null;
  open_date?: string | null;
  close_date?: string | null;
  listing_date?: string | null;
  allotment_date?: string | null;
  listing_open?: number | null;
  listing_close?: number | null;
  listing_gain_pct?: number | null;
  status: IPOStatus;
  description?: string | null;
}

export interface IpoSegment {
  status: IPOStatus;
  label: string;
  count: number;
  items: IpoItem[];
}

export interface IpoCalendarResponse {
  generated_at: string;
  ongoing: IpoSegment;
  upcoming: IpoSegment;
  ended: IpoSegment;
}

// ─── Market Movers (Gainers & Losers) ────────────────────────────────────────

export type PeriodCode = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";
export type MoverDirection = "gainers" | "losers";

export interface MoverItem {
  ticker: string;
  name: string;
  exchange: string;
  sector?: string | null;
  price?: number | null;
  change_pct?: number | null;
  change?: number | null;
  direction: string;
  period: string;
}

export interface MoversResponse {
  period: string;
  direction: string;
  count: number;
  items: MoverItem[];
}

/**
 * Shared config for the Company section's sub-navigation.
 *
 * Kept state-driven (not URL-routed) to match the rest of the dashboard
 * (Portfolio, Watchlist, Screener all switch via DashboardLayout state,
 * not Next.js routes) — see CompanyAnalysis.tsx for how this is consumed.
 */

export type CompanySubTab =
  | "overview"
  | "ratio-analysis"
  | "technical-analysis"
  | "risk-assessment";

export interface CompanySubTabConfig {
  id: CompanySubTab;
  label: string;
}

export const COMPANY_SUB_TABS: CompanySubTabConfig[] = [
  { id: "overview", label: "Overview" },
  { id: "ratio-analysis", label: "Ratio Analysis" },
  { id: "technical-analysis", label: "Technical Analysis" },
  { id: "risk-assessment", label: "Risk Assessment" },
];
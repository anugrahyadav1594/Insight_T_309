"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Construction } from "lucide-react";
import CompanySearch from "./company/CompanySearch";
import CompanyHeader from "./company/CompanyHeader";
import CompanyTabs from "./company/CompanyTabs";
import CompanyOverview from "./company/CompanyOverview";
import CompanyRecommendation from "./company/CompanyRecommendation";
import CompanyFinancials from "./company/CompanyFinancials";
import CompanyPerformance from "./company/CompanyPerformance";
import CompanyAIAnalysis from "./company/CompanyAIAnalysis";
import CompanyRisksOpportunities from "./company/CompanyRisksOpportunities";
import CompanyNews from "./company/CompanyNews";
import { companyDataMap } from "@/lib/companyData";
import type { CompanySubTab } from "@/lib/companyTabs";

interface CompanyAnalysisProps {
  selectedSymbol?: string;
  onBack?: () => void;
}

/**
 * Shared Company layout. Owns which company is loaded and which of the
 * four sub-tabs (Overview / Ratio Analysis / Technical Analysis / Risk
 * Assessment) is active, and renders the header + tab nav once so they
 * aren't duplicated per page.
 *
 * Sub-navigation is React state, not a Next.js route — this matches how
 * the rest of the dashboard (Portfolio/Watchlist/Screener) already
 * switches views inside DashboardLayout, rather than introducing a
 * second routing paradigm for this section only.
 */
export default function CompanyAnalysis({ selectedSymbol = "TCS", onBack }: CompanyAnalysisProps) {
  const [activeSymbol, setActiveSymbol] = useState(selectedSymbol);
  const [activeTab, setActiveTab] = useState<CompanySubTab>("overview");

  // Fallback to TCS if requested symbol isn't found
  const data = companyDataMap[activeSymbol] || companyDataMap.TCS;

  const handleSearch = (symbol: string) => {
    setActiveSymbol(symbol);
    setActiveTab("overview");
  };

  return (
    <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-8 space-y-8">
        {/* Company switcher */}
        <CompanySearch onSearch={handleSearch} onBack={onBack} />

        {/* Shared header + navigation */}
        <div className="space-y-4">
          <CompanyHeader data={data} />
          <CompanyTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Active tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeSymbol}-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {activeTab === "overview" && (
              <>
                <div className="grid gap-8 lg:grid-cols-12">
                  <CompanyOverview data={data} />
                  <CompanyRecommendation data={data} />
                </div>
                <CompanyFinancials data={data} />
                <CompanyPerformance />
                <CompanyAIAnalysis data={data} />
                <CompanyRisksOpportunities data={data} />
                <CompanyNews data={data} />
              </>
            )}

            {activeTab !== "overview" && <ComingSoonPanel tab={activeTab} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Placeholder for Ratio Analysis / Technical Analysis / Risk Assessment
 * until those phases are implemented (see plan Steps 6-8). Keeps the tab
 * navigable now without fabricating data for sections the backend
 * doesn't expose in a ready-to-consume shape yet.
 */
function ComingSoonPanel({ tab }: { tab: CompanySubTab }) {
  const labels: Record<CompanySubTab, string> = {
    overview: "Overview",
    "ratio-analysis": "Ratio Analysis",
    "technical-analysis": "Technical Analysis",
    "risk-assessment": "Risk Assessment",
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-white/10 bg-white/[0.02] py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20">
        <Construction className="h-8 w-8 text-cyan-400" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-400">
        {labels[tab]} is coming in the next phase
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Backend scoring/ratio/technical/risk engines already exist — this tab wires them up next.
      </p>
    </div>
  );
}
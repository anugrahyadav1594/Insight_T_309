"use client";

/**
 * CompanyAnalysis — main entry point for the restructured Company section.
 * Place at: components/dashboard/CompanyAnalysis.tsx (overwrite existing)
 *
 * Update import paths:
 *   import { COMPANY_SUB_TABS, type CompanySubTab } from "@/lib/companyTabs";
 *   import { companyDataMap } from "@/lib/companyData";
 *   import CompanyHeader from "./company/CompanyHeaderNew";
 *   import CompanySearch from "./company/CompanySearch";
 *   import OverviewPage from "./company/OverviewPage";
 *   import RatioAnalysisPage from "./company/RatioAnalysisPage";
 *   import TechnicalAnalysisPage from "./company/TechnicalAnalysisPage";
 *   import RiskAssessmentPage from "./company/RiskAssessmentPage";
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { COMPANY_SUB_TABS, type CompanySubTab } from "@/lib/companyTabs";
import { companyDataMap } from "@/lib/companyData";
import CompanyHeader from "./company/CompanyHeaderNew";
import CompanySearch from "./company/CompanySearch";
import OverviewPage from "./company/OverviewPage";
import RatioAnalysisPage from "./company/RatioAnalysisPage";
import TechnicalAnalysisPage from "./company/TechnicalAnalysisPage";
import RiskAssessmentPage from "./company/RiskAssessmentPage";

interface CompanyAnalysisProps {
  initialTicker?: string;
  selectedSymbol?: string;
  onBack?: () => void;
}

export default function CompanyAnalysis({
  initialTicker = "RELIANCE",
  selectedSymbol,
  onBack,
}: CompanyAnalysisProps) {
  const [selectedTicker, setSelectedTicker] = useState(selectedSymbol || initialTicker);
  const [activeTab, setActiveTab] = useState<CompanySubTab>("overview");

  const companyInfo = useMemo(() => companyDataMap[selectedTicker] || companyDataMap["RELIANCE"], [selectedTicker]);

  const displayName = companyInfo?.name || selectedTicker;
  const displayPrice = companyInfo?.price;
  const displayChange = companyInfo?.change;
  const displaySector = companyInfo?.sector;
  const displayChips = companyInfo?.chips || [];

  const handleCompanySelect = (ticker: string) => {
    setSelectedTicker(ticker);
    setActiveTab("overview");
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case "overview": return <OverviewPage ticker={selectedTicker} companyName={displayName} />;
      case "ratio-analysis": return <RatioAnalysisPage ticker={selectedTicker} companyName={displayName} />;
      case "technical-analysis": return <TechnicalAnalysisPage ticker={selectedTicker} companyName={displayName} />;
      case "risk-assessment": return <RiskAssessmentPage ticker={selectedTicker} companyName={displayName} />;
      default: return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <CompanySearch onSearch={handleCompanySelect} onBack={onBack} />
      <CompanyHeader name={displayName} ticker={selectedTicker} exchange="NSE" sector={displaySector} price={displayPrice} change={displayChange} chips={displayChips} />

      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl">
          {COMPANY_SUB_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                  isActive ? "text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="company-subtab-active"
                    className="absolute inset-0 rounded-xl bg-cyan-500/15 border border-cyan-500/30 shadow-md shadow-cyan-500/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[600px]">{renderActivePage()}</div>
    </div>
  );
}

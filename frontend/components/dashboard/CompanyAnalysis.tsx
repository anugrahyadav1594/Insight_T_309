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
}

export default function CompanyAnalysis({ initialTicker = "RELIANCE" }: CompanyAnalysisProps) {
  const [selectedTicker, setSelectedTicker] = useState(initialTicker);
  const [activeTab, setActiveTab] = useState<CompanySubTab>("overview");

  const companyInfo = useMemo(() => companyDataMap[selectedTicker], [selectedTicker]);

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
      <CompanySearch onSelect={handleCompanySelect} selectedTicker={selectedTicker} />
      <CompanyHeader name={displayName} ticker={selectedTicker} exchange="NSE" sector={displaySector} price={displayPrice} change={displayChange} chips={displayChips} />

      <div className="overflow-x-auto">
        <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 backdrop-blur-xl">
          {COMPANY_SUB_TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? "bg-cyan-500/15 text-cyan-300 shadow-sm" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[600px]">{renderActivePage()}</div>
    </div>
  );
}

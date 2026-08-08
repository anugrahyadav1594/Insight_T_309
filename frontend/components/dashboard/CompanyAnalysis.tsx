"use client";

import { useState } from "react";
import CompanySearch from "./company/CompanySearch";
import CompanyOverview from "./company/CompanyOverview";
import CompanyRecommendation from "./company/CompanyRecommendation";
import CompanyFinancials from "./company/CompanyFinancials";
import CompanyPerformance from "./company/CompanyPerformance";
import CompanyAIAnalysis from "./company/CompanyAIAnalysis";
import CompanyRisksOpportunities from "./company/CompanyRisksOpportunities";
import CompanyNews from "./company/CompanyNews";
import { companyDataMap } from "@/lib/companyData";

interface CompanyAnalysisProps {
  selectedSymbol?: string;
  onBack?: () => void;
}

export default function CompanyAnalysis({ selectedSymbol = "TCS", onBack }: CompanyAnalysisProps) {
  const [activeSymbol, setActiveSymbol] = useState(selectedSymbol);

  // Fallback to TCS if requested symbol isn't found
  const data = companyDataMap[activeSymbol] || companyDataMap.TCS;

  return (
    <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-8 space-y-8">
        {/* Section 1: Autocomplete Search */}
        <CompanySearch onSearch={setActiveSymbol} onBack={onBack} />

        {/* Hero Row: Overview (left) + Recommendation (right) */}
        <div className="grid gap-8 lg:grid-cols-12">
          <CompanyOverview data={data} />
          <CompanyRecommendation data={data} />
        </div>

        {/* Section 4: Financial Highlights */}
        <CompanyFinancials data={data} />

        {/* Section 5: Performance Chart Placeholder */}
        <CompanyPerformance />

        {/* Section 6: AI Core Analysis Accordions */}
        <CompanyAIAnalysis data={data} />

        {/* Section 7: Risks & Opportunities */}
        <CompanyRisksOpportunities data={data} />

        {/* Section 8: News Timeline */}
        <CompanyNews data={data} />
      </div>
    </div>
  );
}

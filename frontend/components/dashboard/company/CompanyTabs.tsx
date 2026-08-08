"use client";

import { motion } from "framer-motion";
import { COMPANY_SUB_TABS, type CompanySubTab } from "@/lib/companyTabs";

interface CompanyTabsProps {
  activeTab: CompanySubTab;
  onTabChange: (tab: CompanySubTab) => void;
}

/**
 * Company section sub-navigation: Overview / Ratio Analysis /
 * Technical Analysis / Risk Assessment. Purely presentational — the
 * parent (CompanyAnalysis) owns which tab is active and what renders
 * for it, so this stays reusable regardless of which company is loaded.
 */
export default function CompanyTabs({ activeTab, onTabChange }: CompanyTabsProps) {
  return (
    <div className="border-b border-white/10">
      <div className="flex gap-1 overflow-x-auto overflow-y-hidden no-scrollbar">
        {COMPANY_SUB_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-semibold
                transition-colors duration-200
                ${isActive ? "text-white" : "text-slate-400 hover:text-slate-200"}
              `}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="company-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-[2px] bg-gradient-to-r from-cyan-400 to-blue-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
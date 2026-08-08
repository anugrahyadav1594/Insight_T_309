"use client";

import { motion } from "framer-motion";
import { AlertOctagon, Sparkles, AlertTriangle, ChevronRight } from "lucide-react";
import type { CompanyAnalysisData } from "@/lib/companyData";

const EASE = [0.16, 1, 0.3, 1] as const;

interface CompanyRisksOpportunitiesProps {
  data: CompanyAnalysisData;
}

export default function CompanyRisksOpportunities({ data }: CompanyRisksOpportunitiesProps) {
  const { risks, opportunities } = data;

  return (
    <div className="mt-8 grid gap-8 md:grid-cols-2">
      {/* Risks Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
        whileHover={{
          y: -6,
          scale: 1.01,
          transition: { type: "spring", stiffness: 260, damping: 24, mass: 0.9 },
        }}
        className="
          group relative overflow-hidden rounded-[32px] border border-white/10
          bg-white/5 p-8 backdrop-blur-3xl shadow-2xl transition-colors duration-500
          ease-out hover:border-red-500/30
        "
      >
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
          <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-red-500/10 blur-[100px]" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Key Risks
            </h4>
            <span className="rounded-full bg-red-500/15 border border-red-500/25 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
              Downside Factors
            </span>
          </div>

          <div className="space-y-4">
            {risks.map((risk, index) => (
              <div key={index} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                <AlertOctagon className="h-5 w-5 shrink-0 text-red-400/80 mt-0.5" />
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-red-500 to-pink-500"
        />
      </motion.div>

      {/* Opportunities Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
        whileHover={{
          y: -6,
          scale: 1.01,
          transition: { type: "spring", stiffness: 260, damping: 24, mass: 0.9 },
        }}
        className="
          group relative overflow-hidden rounded-[32px] border border-white/10
          bg-white/5 p-8 backdrop-blur-3xl shadow-2xl transition-colors duration-500
          ease-out hover:border-emerald-500/30
        "
      >
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
          <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              Growth Opportunities
            </h4>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              Upside Catalysts
            </span>
          </div>

          <div className="space-y-4">
            {opportunities.map((opp, index) => (
              <div key={index} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                <ChevronRight className="h-5 w-5 shrink-0 text-emerald-400/80 mt-0.5" />
                <span>{opp}</span>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-emerald-500 to-teal-500"
        />
      </motion.div>
    </div>
  );
}

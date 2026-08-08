"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, BarChart2, Shield, TrendingUp, Users, Award } from "lucide-react";
import type { CompanyAnalysisData } from "@/lib/companyData";

const EASE = [0.16, 1, 0.3, 1] as const;

interface CompanyAIAnalysisProps {
  data: CompanyAnalysisData;
}

export default function CompanyAIAnalysis({ data }: CompanyAIAnalysisProps) {
  const { analysis } = data;
  const [expandedSection, setExpandedSection] = useState<string | null>("businessQuality");

  const sections = [
    {
      id: "businessQuality",
      title: "Business Quality",
      content: analysis.businessQuality,
      icon: Award,
    },
    {
      id: "valuation",
      title: "Valuation",
      content: analysis.valuation,
      icon: Shield,
    },
    {
      id: "growth",
      title: "Growth",
      content: analysis.growth,
      icon: TrendingUp,
    },
    {
      id: "management",
      title: "Management & Governance",
      content: analysis.management,
      icon: Users,
    },
    {
      id: "moat",
      title: "Economic Moat",
      content: analysis.moat,
      icon: BarChart2,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
      className="
        group relative mt-8 overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 p-8 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out hover:border-cyan-400/40
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative">
        <h3 className="text-xl font-bold text-white mb-6">AI Core Analysis Breakdown</h3>

        <div className="space-y-4">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isExpanded = expandedSection === sec.id;

            return (
              <div
                key={sec.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-cyan-400/30"
              >
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : sec.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-white"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-cyan-400" />
                    <span>{sec.title}</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-5 pt-1 text-slate-300 text-sm leading-relaxed border-t border-white/5 bg-black/20">
                        {sec.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
      />
    </motion.div>
  );
}

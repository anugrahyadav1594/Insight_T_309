"use client";

import { motion } from "framer-motion";
import { BrainCircuit, CheckCircle2 } from "lucide-react";
import type { CompanyAnalysisData } from "@/lib/companyData";

const EASE = [0.16, 1, 0.3, 1] as const;

interface CompanyRecommendationProps {
  data: CompanyAnalysisData;
}

export default function CompanyRecommendation({ data }: CompanyRecommendationProps) {
  const { verdict, score, confidence, summaryPoints } = data.recommendation;

  const verdictColors = {
    "Strong Buy": "from-emerald-400 to-teal-500 text-emerald-400",
    Buy: "from-blue-400 to-indigo-500 text-blue-400",
    Hold: "from-amber-400 to-orange-500 text-amber-400",
    Sell: "from-red-400 to-pink-500 text-red-400",
  };

  const currentColors = verdictColors[verdict] || verdictColors.Hold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="
        group relative overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 p-8 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out hover:border-cyan-400/40 lg:col-span-4 flex flex-col justify-between
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            AI Recommendation
          </span>
          <BrainCircuit className="h-5 w-5 text-cyan-400" />
        </div>

        {/* Verdict and Score */}
        <div className="mt-6 flex items-baseline justify-between">
          <div>
            <div className="text-xs text-slate-400">Decision Verdict</div>
            <div className={`mt-1 text-3xl font-black bg-gradient-to-r ${currentColors} bg-clip-text text-transparent`}>
              {verdict}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Insight Score</div>
            <div className="mt-1 text-3xl font-black text-white">{score}<span className="text-lg text-slate-500">/100</span></div>
          </div>
        </div>

        <div className="mt-2 text-xs font-semibold text-emerald-400">{confidence}</div>

        {/* AI Summary bullet points */}
        <div className="mt-6 space-y-3">
          {summaryPoints.map((point, index) => (
            <div key={index} className="flex items-start gap-2.5 text-slate-300 text-xs leading-relaxed">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>{point}</span>
            </div>
          ))}
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

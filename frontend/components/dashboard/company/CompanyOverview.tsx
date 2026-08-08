"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import type { CompanyAnalysisData } from "@/lib/companyData";

const EASE = [0.16, 1, 0.3, 1] as const;

interface CompanyOverviewProps {
  data: CompanyAnalysisData;
}

export default function CompanyOverview({ data }: CompanyOverviewProps) {
  const isPositive = data.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="
        group relative overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 p-8 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out hover:border-cyan-400/40 lg:col-span-8
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3 w-3" />
              {data.sector}
            </div>
            <h2 className="mt-3 text-3xl font-extrabold text-white">{data.name}</h2>
            <div className="mt-1 text-sm font-semibold text-slate-500">
              NSE: <span className="text-slate-300">{data.symbol}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-black text-white">₹{data.price.toLocaleString("en-IN")}</div>
            <div className={`mt-1 flex items-center justify-end gap-1.5 font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{isPositive ? "+" : ""}{data.change}% Today</span>
            </div>
          </div>
        </div>

        {/* Chips */}
        <div className="mt-8 flex flex-wrap gap-2.5">
          {data.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors duration-300 hover:border-cyan-400/30 hover:bg-white/10 hover:text-white"
            >
              {chip}
            </span>
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

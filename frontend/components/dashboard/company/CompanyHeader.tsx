"use client";

import { motion } from "framer-motion";
import type { CompanyAnalysisData } from "@/lib/companyData";

const EASE = [0.16, 1, 0.3, 1] as const;

interface CompanyHeaderProps {
  data: CompanyAnalysisData;
}

/**
 * Shared header for the Company section: company name + ticker chip.
 * Rendered once above the tab navigation so it's never duplicated across
 * the four sub-pages. Values always come from `data` — never hard-code
 * a specific company here.
 */
export default function CompanyHeader({ data }: CompanyHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-wrap items-center gap-3"
    >
      <h1 className="text-2xl font-extrabold text-white md:text-3xl">
        {data.name}
      </h1>
      <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold tracking-wide text-cyan-300">
        {data.symbol}
      </span>
    </motion.div>
  );
}
"use client";

import { motion } from "framer-motion";
import { AreaChart } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function CompanyPerformance() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
      whileHover={{
        y: -6,
        scale: 1.01,
        transition: { type: "spring", stiffness: 260, damping: 24, mass: 0.9 },
      }}
      className="
        group relative mt-8 overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 p-8 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out transform-gpu will-change-transform hover:border-cyan-400/40
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Price Performance</h3>
          <p className="mt-0.5 text-xs text-slate-400">Historical trading bands and technical trendlines</p>
        </div>
        <motion.div
          whileHover={{ rotate: 8 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400"
        >
          <AreaChart className="h-5 w-5" />
        </motion.div>
      </div>

      {/* Placeholder */}
      <div className="relative mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20">
          <AreaChart className="h-8 w-8 text-cyan-400" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-400">
          Interactive stock charts (1D, 1W, 1M, 1Y, 5Y)
        </p>
        <p className="mt-1 text-xs text-slate-600">Coming soon in next update</p>

        {/* Decorative shimmer */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12"
          />
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

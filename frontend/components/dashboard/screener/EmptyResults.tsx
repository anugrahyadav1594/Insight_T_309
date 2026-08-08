"use client";

import { motion } from "framer-motion";
import { Search, RotateCcw } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

interface EmptyResultsProps {
  onReset: () => void;
}

export default function EmptyResults({ onReset }: EmptyResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.22, ease: EASE }}
      className="
        group relative mt-8 overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out hover:border-cyan-400/40
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20">
          <Search className="h-8 w-8 text-cyan-400" />
        </div>
        <h3 className="mt-6 text-lg font-bold text-white">No Stocks Match Your Filters</h3>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Try relaxing your parameter constraints (e.g. higher maximum P/E or lower minimum ROE) to see candidates.
        </p>

        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.04, transition: HOVER_SPRING }}
          whileTap={{ scale: 0.96 }}
          className="mt-6 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-cyan-500/25"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Filters
        </motion.button>
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

"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import type { AISignal } from "@/lib/watchlistData";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

const SIGNAL_OPTIONS: (AISignal | "All")[] = ["All", "Bullish", "Buy Zone", "Accumulate", "Neutral", "Bearish"];

interface WatchlistSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeFilter: AISignal | "All";
  onFilterChange: (f: AISignal | "All") => void;
}

export default function WatchlistSearch({
  query,
  onQueryChange,
  activeFilter,
  onFilterChange,
}: WatchlistSearchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
      className="
        group relative mt-8 overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 p-6 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out hover:border-cyan-400/40
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by symbol or company name…"
            className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
          {SIGNAL_OPTIONS.map((signal) => (
            <motion.button
              key={signal}
              onClick={() => onFilterChange(signal)}
              whileHover={{ scale: 1.06, transition: HOVER_SPRING }}
              whileTap={{ scale: 0.94 }}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
                activeFilter === signal
                  ? "border border-cyan-400/40 bg-cyan-500/20 text-cyan-300"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300"
              }`}
            >
              {signal}
            </motion.button>
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

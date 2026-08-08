"use client";

import { motion } from "framer-motion";
import { Star, Plus } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

interface WatchlistEmptyProps {
  onAddStock?: () => void;
}

export default function WatchlistEmpty({ onAddStock }: WatchlistEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
      className="
        group relative mt-8 overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out hover:border-cyan-400/40
      "
    >
      {/* Hover Glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center justify-center py-24 px-8 text-center">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/20">
          <Star className="h-10 w-10 text-cyan-400" />
        </div>

        <h3 className="mt-6 text-xl font-bold text-white">
          Your Watchlist is Empty
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-400 leading-relaxed">
          Start tracking companies to receive AI insights, signals, and real-time market updates.
        </p>

        <motion.button
          onClick={onAddStock}
          whileHover={{ scale: 1.04, transition: HOVER_SPRING }}
          whileTap={{ scale: 0.96 }}
          className="mt-8 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25"
        >
          <Plus className="h-4 w-4" />
          Add Your First Stock
        </motion.button>

        {/* Decorative shimmer */}
        <div className="absolute inset-0 overflow-hidden rounded-[32px]">
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -skew-x-12"
          />
        </div>
      </div>

      {/* Bottom Accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
      />
    </motion.div>
  );
}

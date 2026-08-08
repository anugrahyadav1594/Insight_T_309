"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal, Bookmark } from "lucide-react";

const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

interface ScreenerHeaderProps {
  onBack?: () => void;
  onSaveScreen?: () => void;
}

export default function ScreenerHeader({ onBack, onSaveScreen }: ScreenerHeaderProps) {
  return (
    <div>
      {/* Top Row: Pill Badge only - removed arrows */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-xl">
          <SlidersHorizontal className="h-4 w-4" />
          AI Stock Screener
        </div>

        <motion.button
          onClick={onSaveScreen}
          whileHover={{ scale: 1.05, transition: HOVER_SPRING }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/20"
        >
          <Bookmark className="h-4 w-4" />
          Save Screen
        </motion.button>
      </div>

      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl text-white">
        Stock{" "}
        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Screener
        </span>
      </h1>
      <p className="mt-1 text-slate-400">
        Discover new investment candidates filtered by financial metrics and ranked by AI Scores.
      </p>
    </div>
  );
}

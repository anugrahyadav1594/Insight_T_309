"use client";

import { motion } from "framer-motion";
import { Briefcase, Wand2, X } from "lucide-react";

interface PortfolioHeaderProps {
  onBack?: () => void;
  onToggleWhatIf?: () => void;
  whatIfMode?: boolean;
  onExitWhatIf?: () => void;
}

export default function PortfolioHeader({
  onBack,
  onToggleWhatIf,
  whatIfMode = false,
  onExitWhatIf,
}: PortfolioHeaderProps) {
  return (
    <div>
      {/* Top Row: pill badge + What If button */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-xl">
          <Briefcase className="h-4 w-4" />
          Portfolio Workspace
        </div>

        {!whatIfMode ? (
          <motion.button
            onClick={onToggleWhatIf}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition-colors hover:border-amber-300/40 hover:bg-amber-400/10 hover:text-amber-200"
          >
            <Wand2 className="h-4 w-4" />
            What if
          </motion.button>
        ) : (
          <motion.button
            onClick={onExitWhatIf}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 backdrop-blur-xl transition-colors hover:bg-amber-400/20"
          >
            <X className="h-4 w-4" />
            Exit What If
          </motion.button>
        )}
      </div>

      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl text-white">
        Portfolio
      </h1>
      <p className="mt-1 text-slate-400">Demo Portfolio</p>
    </div>
  );
}

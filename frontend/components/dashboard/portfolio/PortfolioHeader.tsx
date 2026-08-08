"use client";

import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

interface PortfolioHeaderProps {
  onBack?: () => void;
}

export default function PortfolioHeader({ onBack }: PortfolioHeaderProps) {
  return (
    <div>
      {/* Top Row: Pill Badge only - removed arrows */}
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-xl">
        <Briefcase className="h-4 w-4" />
        Portfolio Workspace
      </div>

      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl text-white">
        Portfolio
      </h1>
      <p className="mt-1 text-slate-400">Demo Portfolio</p>
    </div>
  );
}

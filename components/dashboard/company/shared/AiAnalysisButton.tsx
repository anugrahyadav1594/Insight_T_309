"use client";

/**
 * AiAnalysisButton — full-width CTA button for triggering AI analysis.
 */

import { Sparkles } from "lucide-react";
import { useState } from "react";

interface AiAnalysisButtonProps {
  label: string;
  onClick?: () => void | Promise<void>;
}

export default function AiAnalysisButton({ label, onClick }: AiAnalysisButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onClick?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 px-6 py-4 text-sm font-semibold text-cyan-300 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:from-cyan-500/20 hover:to-blue-600/20 hover:shadow-lg hover:shadow-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Sparkles className={`h-5 w-5 transition-transform duration-300 group-hover:rotate-12 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Generating..." : label}
    </button>
  );
}

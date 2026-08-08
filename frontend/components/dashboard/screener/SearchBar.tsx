"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAIPrompt: (prompt: string) => void;
}

export default function SearchBar({ searchQuery, onSearchChange, onAIPrompt }: SearchBarProps) {
  const [aiPromptText, setAiPromptText] = useState("");

  const handleAIPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiPromptText.trim()) {
      onAIPrompt(aiPromptText.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter results by symbol or company name..."
          className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
        />
      </div>

      {/* AI Prompt Box (Section 8: AI Prompt Builder) */}
      <form
        onSubmit={handleAIPromptSubmit}
        className="rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-6 backdrop-blur-3xl shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Sparkles className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-400" />
            <input
              type="text"
              value={aiPromptText}
              onChange={(e) => setAiPromptText(e.target.value)}
              placeholder="Ask Insight AI (e.g. 'Find undervalued IT companies with high ROE')"
              className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.04, transition: HOVER_SPRING }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/25"
          >
            Ask Insight
          </motion.button>
        </div>
      </form>
    </div>
  );
}

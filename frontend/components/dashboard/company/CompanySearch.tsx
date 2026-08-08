"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { companyDataMap } from "@/lib/companyData";

interface CompanySearchProps {
  onSearch: (symbol: string) => void;
  onBack?: () => void;
}

export default function CompanySearch({ onSearch, onBack }: CompanySearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = Object.values(companyDataMap).filter(
    (c) =>
      c.symbol.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative z-30">
      <div className="relative max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company (e.g. TCS, INFY, HDFCBANK)..."
            className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
          />
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {isFocused && (query.length > 0 || suggestions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-[#0c1322] p-2 shadow-2xl backdrop-blur-2xl"
            >
              {suggestions.length > 0 ? (
                suggestions.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => {
                      onSearch(s.symbol);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:bg-white/5"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">{s.symbol}</div>
                      <div className="text-xs text-slate-400">{s.name}</div>
                    </div>
                    <span className="text-xs font-semibold text-cyan-400">{s.sector}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-xs text-slate-500">
                  No matches found. Try TCS, INFY, HDFCBANK, or RELIANCE
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

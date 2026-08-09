"use client";

import { useState, useEffect } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { companyDataMap } from "@/lib/companyData";
import { searchCompanies } from "@/lib/api";

interface CompanySearchProps {
  onSearch?: (symbol: string) => void;
  onSelect?: (symbol: string) => void;
  onBack?: () => void;
  selectedTicker?: string;
}

export default function CompanySearch({ onSearch, onSelect, onBack }: CompanySearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<{ ticker: string; name: string; sector?: string | null }[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(
        Object.values(companyDataMap).map((c) => ({
          ticker: c.symbol,
          name: c.name,
          sector: c.sector,
        }))
      );
      return;
    }

    let cancelled = false;
    searchCompanies(query.trim(), 10)
      .then((res) => {
        if (!cancelled && res?.items && res.items.length > 0) {
          setResults(res.items.map((item) => ({ ticker: item.ticker, name: item.name, sector: item.sector })));
        } else if (!cancelled) {
          const filtered = Object.values(companyDataMap).filter(
            (c) =>
              c.symbol.toLowerCase().includes(query.toLowerCase()) ||
              c.name.toLowerCase().includes(query.toLowerCase())
          );
          setResults(filtered.map((c) => ({ ticker: c.symbol, name: c.name, sector: c.sector })));
        }
      })
      .catch(() => {
        if (!cancelled) {
          const filtered = Object.values(companyDataMap).filter(
            (c) =>
              c.symbol.toLowerCase().includes(query.toLowerCase()) ||
              c.name.toLowerCase().includes(query.toLowerCase())
          );
          setResults(filtered.map((c) => ({ ticker: c.symbol, name: c.name, sector: c.sector })));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleSelect = (symbol: string) => {
    if (onSearch) onSearch(symbol);
    if (onSelect) onSelect(symbol);
    setQuery("");
  };

  return (
    <div className="relative z-30 flex items-center gap-4">
      {onBack && (
        <button
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white"
          title="Back to Dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <div className="relative w-full max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company (e.g. TCS, INFY, HDFCBANK)..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-slate-200 placeholder-slate-400 outline-none transition-all focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
          />
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {isFocused && (query.length > 0 || results.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c1324]/95 to-[#070b14]/95 p-2 shadow-2xl backdrop-blur-2xl"
            >
              {results.length > 0 ? (
                results.slice(0, 8).map((s) => (
                  <button
                    key={s.ticker}
                    onClick={() => handleSelect(s.ticker)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all hover:bg-cyan-500/10 hover:border hover:border-cyan-400/30"
                  >
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{s.ticker}</div>
                      <div className="text-xs text-slate-400 font-medium">{s.name}</div>
                    </div>
                    {s.sector && <span className="text-xs font-bold text-cyan-400">{s.sector}</span>}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-xs text-slate-400">
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

"use client";

/**
 * CompanySearch — search bar for selecting a company.
 * Place at: components/dashboard/company/CompanySearch.tsx
 *
 * Update import path:
 *   import { companyDataMap } from "@/lib/companyData";
 */

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { companyDataMap } from "@/lib/companyData";

interface CompanySearchProps {
  onSelect: (ticker: string) => void;
  selectedTicker: string;
}

export default function CompanySearch({ onSelect, selectedTicker }: CompanySearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tickers = Object.keys(companyDataMap);

  const results = query.trim()
    ? tickers.filter((t) => {
        const c = companyDataMap[t];
        const q = query.toLowerCase();
        return t.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q);
      })
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (ticker: string) => {
    onSelect(ticker);
    setQuery("");
    setIsOpen(false);
  };

  const currentCompany = companyDataMap[selectedTicker];

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-xl transition-colors duration-200 focus-within:border-cyan-500/30">
        <Search className="h-4 w-4 text-slate-500" />
        <input
          ref={inputRef} type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={`Search companies... (currently: ${currentCompany?.name || selectedTicker})`}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="text-slate-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1120]/95 backdrop-blur-2xl shadow-2xl">
          {results.map((ticker) => {
            const c = companyDataMap[ticker];
            const isActive = ticker === selectedTicker;
            return (
              <button key={ticker} onClick={() => handleSelect(ticker)}
                className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors ${isActive ? "bg-cyan-500/10 text-white" : "text-slate-300 hover:bg-white/[0.04] hover:text-white"}`}>
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.sector}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">₹{c.price.toLocaleString("en-IN")}</p>
                  <p className={`text-xs ${c.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {c.change >= 0 ? "+" : ""}{c.change}%
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-white/[0.08] bg-[#0b1120]/95 p-5 text-center backdrop-blur-2xl shadow-2xl">
          <p className="text-sm text-slate-500">No companies found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

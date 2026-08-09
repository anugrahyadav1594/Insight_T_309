"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, X, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WatchlistHeader from "./watchlist/WatchlistHeader";
import WatchlistStats from "./watchlist/WatchlistStats";
import WatchlistSearch from "./watchlist/WatchlistSearch";
import WatchlistTable from "./watchlist/WatchlistTable";
import WatchlistEmpty from "./watchlist/WatchlistEmpty";
import { watchlist as initialWatchlist, ALL_STOCK_DATABASE, getWatchlistStats, type WatchlistStock, type AISignal } from "@/lib/watchlistData";
import { listWatchlists, getWatchlist, addWatchlistItem, removeWatchlistItem, ApiError } from "@/lib/api";
import type { EnrichedItem } from "@/lib/types";

interface WatchlistProps {
  onBack?: () => void;
  onViewStock?: (symbol: string) => void;
}

export default function Watchlist({ onBack, onViewStock }: WatchlistProps) {
  const [stocks, setStocks] = useState<WatchlistStock[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("insight_user_watchlist_stocks");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return initialWatchlist;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<AISignal | "All">("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  // Sync with localStorage & Company Header Watchlist toggle events
  useEffect(() => {
    const syncWatchlist = () => {
      try {
        const savedSymbols = localStorage.getItem("insight_user_watchlist_symbols");
        if (savedSymbols) {
          const symbols: string[] = JSON.parse(savedSymbols);
          const updated = ALL_STOCK_DATABASE.filter((s) => symbols.includes(s.symbol.toUpperCase()));
          setStocks(updated);
          localStorage.setItem("insight_user_watchlist_stocks", JSON.stringify(updated));
        }
      } catch {}
    };

    window.addEventListener("insight_watchlist_updated", syncWatchlist);
    return () => window.removeEventListener("insight_watchlist_updated", syncWatchlist);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const list = await listWatchlists();
        if (cancelled) return;

        if (list.items.length === 0) {
          setLoading(false);
          return;
        }

        const watchlistId = list.items[0].id;
        setActiveWatchlistId(watchlistId);
        const detail = await getWatchlist(watchlistId);
        if (cancelled) return;

        const mappedStocks: WatchlistStock[] = detail.items.map((item: EnrichedItem) => {
          let signal: AISignal = "Neutral";
          if (item.signal) {
            const upper = item.signal.toUpperCase();
            if (upper.includes("BULL") || upper.includes("BUY")) signal = "Bullish";
            else if (upper.includes("ACCUMULATE")) signal = "Accumulate";
            else if (upper.includes("BEAR")) signal = "Bearish";
          }

          return {
            symbol: item.company.ticker,
            company: item.company.name,
            price: item.price ?? 0,
            change: item.day_change_pct ?? 0,
            volume: "Normal",
            aiSignal: signal,
            aiScore: Math.round(item.score ?? 50),
          };
        });

        if (mappedStocks.length > 0) {
          setStocks(mappedStocks);
          localStorage.setItem("insight_user_watchlist_stocks", JSON.stringify(mappedStocks));
        }
        setError(null);
      } catch {
        if (cancelled) return;
        setError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleAddStockItem = async (stockItem: WatchlistStock) => {
    if (stocks.some((s) => s.symbol === stockItem.symbol)) return;

    if (activeWatchlistId) {
      try {
        await addWatchlistItem(activeWatchlistId, stockItem.symbol);
      } catch {
        // Fall back to local UI state addition if server fails or mock
      }
    }

    const updated = [stockItem, ...stocks];
    setStocks(updated);
    localStorage.setItem("insight_user_watchlist_stocks", JSON.stringify(updated));

    const symbols = updated.map((s) => s.symbol.toUpperCase());
    localStorage.setItem("insight_user_watchlist_symbols", JSON.stringify(symbols));
    window.dispatchEvent(new Event("insight_watchlist_updated"));
  };

  const handleRemoveStock = async (symbol: string) => {
    if (activeWatchlistId) {
      try {
        await removeWatchlistItem(activeWatchlistId, symbol);
      } catch {}
    }

    setStocks((prev) => {
      const updated = prev.filter((s) => s.symbol !== symbol);
      localStorage.setItem("insight_user_watchlist_stocks", JSON.stringify(updated));

      const symbols = updated.map((s) => s.symbol.toUpperCase());
      localStorage.setItem("insight_user_watchlist_symbols", JSON.stringify(symbols));
      window.dispatchEvent(new Event("insight_watchlist_updated"));
      return updated;
    });
  };

  // Filtering
  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.company.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "All" || stock.aiSignal === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const stats = getWatchlistStats(filteredStocks);

  if (loading) {
    return (
      <div className="relative min-h-screen px-6 pt-24 pb-20 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm text-slate-400">Loading watchlist...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-8">
        {error && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            ⚠️ Using demo data — {error}
          </div>
        )}
        <WatchlistHeader onBack={onBack} onAddStock={handleOpenAddModal} />

        {stocks.length > 0 ? (
          <>
            <WatchlistStats
              total={stats.total}
              bullish={stats.bullish}
              bearish={stats.bearish}
              alerts={stats.alerts}
            />
            <WatchlistSearch
              query={searchQuery}
              onQueryChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
            {filteredStocks.length > 0 ? (
              <WatchlistTable stocks={filteredStocks} onViewStock={onViewStock} onRemoveStock={handleRemoveStock} />
            ) : (
              <div className="mt-8 text-center text-slate-500 py-12 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                No stocks match your search/filter criteria.
              </div>
            )}
          </>
        ) : (
          <WatchlistEmpty onAddStock={handleOpenAddModal} />
        )}
      </div>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1324]/95 to-[#070b14]/95 p-6 shadow-2xl backdrop-blur-3xl z-10"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <h3 className="text-lg font-bold text-slate-100">Add Stock to Watchlist</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Search company or ticker symbol..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-400 outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                {ALL_STOCK_DATABASE.filter((s) =>
                  s.company.toLowerCase().includes(addSearch.toLowerCase()) ||
                  s.symbol.toLowerCase().includes(addSearch.toLowerCase())
                ).map((s) => {
                  const isAdded = stocks.some((item) => item.symbol === s.symbol);
                  return (
                    <div
                      key={s.symbol}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5 transition hover:border-cyan-400/40"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-100">{s.symbol}</p>
                        <p className="text-xs text-slate-400">{s.company}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-300">₹{s.price.toLocaleString("en-IN")}</span>
                        <button
                          disabled={isAdded}
                          onClick={() => handleAddStockItem(s)}
                          className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                            isAdded
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                              : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:scale-105"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" /> Add
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
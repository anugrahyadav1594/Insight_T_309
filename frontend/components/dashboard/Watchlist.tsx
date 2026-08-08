"use client";

import { useState } from "react";
import WatchlistHeader from "./watchlist/WatchlistHeader";
import WatchlistStats from "./watchlist/WatchlistStats";
import WatchlistSearch from "./watchlist/WatchlistSearch";
import WatchlistTable from "./watchlist/WatchlistTable";
import WatchlistEmpty from "./watchlist/WatchlistEmpty";
import { watchlist as initialWatchlist, getWatchlistStats, type AISignal } from "@/lib/watchlistData";

interface WatchlistProps {
  onBack?: () => void;
  onViewStock?: (symbol: string) => void;
}

export default function Watchlist({ onBack, onViewStock }: WatchlistProps) {
  const [stocks, setStocks] = useState(initialWatchlist);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<AISignal | "All">("All");

  const handleAddStock = () => {
    // For now, this is a mock action that adds a random stock if not already present
    const pool = [
      { symbol: "TATASTEEL", company: "Tata Steel Ltd", price: 125, change: 1.2, volume: "Normal" as const, aiSignal: "Bullish" as const, aiScore: 82 },
      { symbol: "INFY", company: "Infosys Ltd", price: 1680, change: 2.1, volume: "High" as const, aiSignal: "Bullish" as const, aiScore: 88 },
      { symbol: "RELIANCE", company: "Reliance Industries", price: 2510, change: 0.6, volume: "Normal" as const, aiSignal: "Accumulate" as const, aiScore: 84 },
    ];
    const next = pool.find((item) => !stocks.some((s) => s.symbol === item.symbol));
    if (next) {
      setStocks((prev) => [next, ...prev]);
    } else {
      // If all are present, just add a dummy stock
      const randomId = Math.floor(Math.random() * 1000);
      const customStock = {
        symbol: `MOCK${randomId}`,
        company: `Mock Company ${randomId}`,
        price: Math.floor(Math.random() * 5000) + 100,
        change: parseFloat((Math.random() * 10 - 5).toFixed(1)),
        volume: (Math.random() > 0.5 ? "High" : "Normal") as "High" | "Normal",
        aiSignal: (Math.random() > 0.5 ? "Bullish" : "Neutral") as AISignal,
        aiScore: Math.floor(Math.random() * 40) + 60,
      };
      setStocks((prev) => [customStock, ...prev]);
    }
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

  return (
    <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-8">
        <WatchlistHeader onBack={onBack} onAddStock={handleAddStock} />
        
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
              <WatchlistTable stocks={filteredStocks} onViewStock={onViewStock} />
            ) : (
              <div className="mt-8 text-center text-slate-500 py-12 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                No stocks match your search/filter criteria.
              </div>
            )}
          </>
        ) : (
          <WatchlistEmpty onAddStock={handleAddStock} />
        )}
      </div>
    </div>
  );
}

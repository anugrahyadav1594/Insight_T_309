"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import WatchlistHeader from "./watchlist/WatchlistHeader";
import WatchlistStats from "./watchlist/WatchlistStats";
import WatchlistSearch from "./watchlist/WatchlistSearch";
import WatchlistTable from "./watchlist/WatchlistTable";
import WatchlistEmpty from "./watchlist/WatchlistEmpty";
import { watchlist as initialWatchlist, getWatchlistStats, type WatchlistStock, type AISignal } from "@/lib/watchlistData";
import { listWatchlists, getWatchlist, addWatchlistItem, ApiError } from "@/lib/api";
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

  const handleAddStock = async () => {
    const pool = [
      { symbol: "TATASTEEL", company: "Tata Steel Ltd", price: 125, change: 1.2, volume: "Normal" as const, aiSignal: "Bullish" as const, aiScore: 82 },
      { symbol: "INFY", company: "Infosys Ltd", price: 1680, change: 2.1, volume: "High" as const, aiSignal: "Bullish" as const, aiScore: 88 },
      { symbol: "RELIANCE", company: "Reliance Industries", price: 2510, change: 0.6, volume: "Normal" as const, aiSignal: "Accumulate" as const, aiScore: 84 },
    ];
    const next = pool.find((item) => !stocks.some((s) => s.symbol === item.symbol));
    const tickerToAdd = next ? next.symbol : `MOCK${Math.floor(Math.random() * 1000)}`;

    if (activeWatchlistId) {
      try {
        await addWatchlistItem(activeWatchlistId, tickerToAdd);
      } catch {
        // Fall back to local UI state addition if server fails or mock
      }
    }

    if (next) {
      setStocks((prev) => {
        const updated = [next, ...prev];
        localStorage.setItem("insight_user_watchlist_stocks", JSON.stringify(updated));
        return updated;
      });
    } else {
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
      setStocks((prev) => {
        const updated = [customStock, ...prev];
        localStorage.setItem("insight_user_watchlist_stocks", JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleRemoveStock = (symbol: string) => {
    setStocks((prev) => {
      const updated = prev.filter((s) => s.symbol !== symbol);
      localStorage.setItem("insight_user_watchlist_stocks", JSON.stringify(updated));
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
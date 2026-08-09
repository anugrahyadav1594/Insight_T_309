"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Bookmark, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { listWatchlists, addWatchlistItem, removeWatchlistItem } from "@/lib/api";

interface CompanyHeaderProps {
  name: string;
  ticker: string;
  exchange?: string;
  sector?: string;
  price?: number;
  change?: number;
  chips?: string[];
}

export default function CompanyHeader({
  name, ticker, exchange = "NSE", sector, price, change, chips = [],
}: CompanyHeaderProps) {
  const isPositive = (change ?? 0) >= 0;
  const [isWatchlisted, setIsWatchlisted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !ticker) return;
    try {
      const saved = localStorage.getItem("insight_user_watchlist_symbols");
      const list: string[] = saved ? JSON.parse(saved) : [];
      setIsWatchlisted(list.includes(ticker.toUpperCase()));
    } catch {
      setIsWatchlisted(false);
    }
  }, [ticker]);

  const toggleWatchlist = async () => {
    if (typeof window === "undefined" || !ticker) return;
    const upper = ticker.toUpperCase();

    try {
      const savedSymbols = localStorage.getItem("insight_user_watchlist_symbols");
      let symbolList: string[] = savedSymbols ? JSON.parse(savedSymbols) : [];

      const savedStocks = localStorage.getItem("insight_user_watchlist_stocks");
      let stockList: any[] = savedStocks ? JSON.parse(savedStocks) : [];

      const willBeWatchlisted = !symbolList.includes(upper);

      if (willBeWatchlisted) {
        symbolList.push(upper);
        if (!stockList.some((s) => s.symbol.toUpperCase() === upper)) {
          stockList.push({
            symbol: upper,
            company: name || upper,
            price: price ?? 3725,
            change: change ?? 1.8,
            volume: "Normal",
            aiSignal: (change ?? 0) >= 0 ? "Bullish" : "Neutral",
            aiScore: 85,
          });
        }
        setIsWatchlisted(true);
        toast.success(`${name || upper} added to Watchlist`, {
          description: "Saved to your active Watchlist workspace.",
        });
      } else {
        symbolList = symbolList.filter((s) => s !== upper);
        stockList = stockList.filter((s) => s.symbol.toUpperCase() !== upper);
        setIsWatchlisted(false);
        toast.info(`${name || upper} removed from Watchlist`);
      }

      localStorage.setItem("insight_user_watchlist_symbols", JSON.stringify(symbolList));
      localStorage.setItem("insight_user_watchlist_stocks", JSON.stringify(stockList));
      window.dispatchEvent(new Event("insight_watchlist_updated"));

      // Try server sync
      try {
        const watchlists = await listWatchlists();
        if (watchlists.items.length > 0) {
          const wId = watchlists.items[0].id;
          if (willBeWatchlisted) {
            await addWatchlistItem(wId, upper);
          } else {
            await removeWatchlistItem(wId, upper);
          }
        }
      } catch (e) {
        // Fall back gracefully
      }
    } catch (e) {
      console.error("Watchlist toggle failed", e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-xl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight">{name}</h1>
            <span className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
              {ticker} · {exchange}
            </span>
            {sector && (
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                {sector}
              </span>
            )}
          </div>

          {price !== undefined && (
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-black text-white sm:text-4xl">
                ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              {change !== undefined && (
                <span
                  className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-sm font-bold ${
                    isPositive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {isPositive ? "+" : ""}{change.toFixed(2)}%
                </span>
              )}
            </div>
          )}

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-400/40"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={toggleWatchlist}
            className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold transition-all duration-300 ${
              isWatchlisted
                ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.25)] scale-[1.03]"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300"
            }`}
          >
            {isWatchlisted ? (
              <>
                <Check className="h-4 w-4 text-cyan-300" />
                <span>In Watchlist</span>
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 text-slate-400" />
                <span>Watchlist</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
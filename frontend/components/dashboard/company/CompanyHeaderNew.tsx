"use client";

import { TrendingUp, TrendingDown, Bookmark, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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
                  className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium text-slate-300"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 hover:text-white">
            <Bookmark className="h-4 w-4 text-cyan-400" />
            Watchlist
          </button>
          <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105">
            <Plus className="h-4 w-4" />
            Add Holding
          </button>
        </div>
      </div>
    </motion.div>
  );
}
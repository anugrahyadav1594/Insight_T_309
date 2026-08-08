"use client";

import { motion } from "framer-motion";
import { Eye, TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";
import type { WatchlistStock, AISignal } from "@/lib/watchlistData";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

const SIGNAL_STYLES: Record<AISignal, string> = {
  Bullish: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Buy Zone": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Accumulate: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  Neutral: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  Bearish: "bg-red-500/15 text-red-400 border-red-500/30",
};

const VOLUME_STYLES: Record<string, { color: string; icon: React.ElementType }> = {
  High: { color: "text-emerald-400", icon: BarChart3 },
  Normal: { color: "text-slate-400", icon: Activity },
  Low: { color: "text-amber-400", icon: Activity },
};

interface WatchlistTableProps {
  stocks: WatchlistStock[];
  onViewStock?: (symbol: string) => void;
}

export default function WatchlistTable({ stocks, onViewStock }: WatchlistTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.28, ease: EASE }}
      className="
        group relative mt-8 overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out hover:border-cyan-400/40
      "
    >
      {/* Hover Glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      {/* Table Header */}
      <div className="relative flex items-center justify-between border-b border-white/10 px-8 py-5">
        <div>
          <h3 className="text-lg font-bold text-white">Tracked Stocks</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {stocks.length} {stocks.length === 1 ? "stock" : "stocks"} matching your criteria
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-8 py-4 font-semibold">Symbol</th>
              <th className="px-4 py-4 font-semibold">Company</th>
              <th className="px-4 py-4 font-semibold text-right">Price</th>
              <th className="px-4 py-4 font-semibold text-right">Change</th>
              <th className="px-4 py-4 font-semibold text-center">Volume</th>
              <th className="px-4 py-4 font-semibold text-center">AI Signal</th>
              <th className="px-8 py-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, i) => {
              const isPositive = stock.change >= 0;
              const volStyle = VOLUME_STYLES[stock.volume] || VOLUME_STYLES.Normal;
              const VolIcon = volStyle.icon;

              return (
                <motion.tr
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.32 + i * 0.04, ease: EASE }}
                  className="group/row border-b border-white/5 transition-colors duration-300 hover:bg-white/[0.04]"
                >
                  {/* Symbol */}
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${
                        isPositive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <span className="font-bold text-white">{stock.symbol}</span>
                    </div>
                  </td>

                  {/* Company */}
                  <td className="px-4 py-4 text-slate-400 max-w-[180px] truncate">
                    {stock.company}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4 text-right font-semibold text-white">
                    {formatPrice(stock.price)}
                  </td>

                  {/* Change */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isPositive ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                      )}
                      <span className={`font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                        {isPositive ? "+" : ""}{stock.change.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Volume */}
                  <td className="px-4 py-4 text-center">
                    <div className={`inline-flex items-center gap-1.5 ${volStyle.color}`}>
                      <VolIcon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{stock.volume}</span>
                    </div>
                  </td>

                  {/* AI Signal */}
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${SIGNAL_STYLES[stock.aiSignal]}`}>
                      {stock.aiSignal}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-8 py-4 text-right">
                    <motion.button
                      onClick={() => onViewStock?.(stock.symbol)}
                      whileHover={{ scale: 1.06, transition: HOVER_SPRING }}
                      whileTap={{ scale: 0.94 }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:bg-white/10 hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </motion.button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
      />
    </motion.div>
  );
}

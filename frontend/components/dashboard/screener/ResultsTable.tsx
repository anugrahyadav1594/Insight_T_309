"use client";

import { motion } from "framer-motion";
import { Eye, ChevronUp, ChevronDown } from "lucide-react";
import type { Stock } from "./types";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

const VERDICT_STYLES = {
  "Strong Buy": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Buy: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Hold: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Avoid: "bg-red-500/15 text-red-400 border-red-500/30",
};

interface ResultsTableProps {
  stocks: Stock[];
  onViewStock?: (symbol: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
}

export default function ResultsTable({
  stocks,
  onViewStock,
  sortBy,
  sortDirection,
  onSort,
}: ResultsTableProps) {
  const renderSortArrow = (column: string) => {
    if (sortBy !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 text-cyan-400" />
    ) : (
      <ChevronDown className="h-4 w-4 text-cyan-400" />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
      className="
        group relative mt-8 overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 backdrop-blur-3xl shadow-2xl transition-colors duration-500
        ease-out hover:border-cyan-400/40
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-white/10 px-8 py-5">
        <div>
          <h3 className="text-lg font-bold text-white">Screener Results</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {stocks.length} {stocks.length === 1 ? "stock matches" : "stocks match"} your criteria
          </p>
        </div>
      </div>

      {/* Table grid */}
      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
              <th
                onClick={() => onSort("symbol")}
                className="px-8 py-4 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  Company {renderSortArrow("symbol")}
                </div>
              </th>
              <th
                onClick={() => onSort("sector")}
                className="px-4 py-4 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  Sector {renderSortArrow("sector")}
                </div>
              </th>
              <th
                onClick={() => onSort("price")}
                className="px-4 py-4 font-semibold text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Price {renderSortArrow("price")}
                </div>
              </th>
              <th
                onClick={() => onSort("aiScore")}
                className="px-4 py-4 font-semibold text-center cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-center gap-1.5">
                  AI Score {renderSortArrow("aiScore")}
                </div>
              </th>
              <th
                onClick={() => onSort("pe")}
                className="px-4 py-4 font-semibold text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  PE {renderSortArrow("pe")}
                </div>
              </th>
              <th
                onClick={() => onSort("roe")}
                className="px-4 py-4 font-semibold text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  ROE {renderSortArrow("roe")}
                </div>
              </th>
              <th
                onClick={() => onSort("revenueGrowth")}
                className="px-4 py-4 font-semibold text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Revenue {renderSortArrow("revenueGrowth")}
                </div>
              </th>
              <th
                onClick={() => onSort("debtEquity")}
                className="px-4 py-4 font-semibold text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Debt {renderSortArrow("debtEquity")}
                </div>
              </th>
              <th className="px-4 py-4 font-semibold text-center">Recommendation</th>
              <th className="px-8 py-4 font-semibold text-right">View</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock, i) => {
              const badgeStyle = VERDICT_STYLES[stock.recommendation] || VERDICT_STYLES.Hold;

              return (
                <motion.tr
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.28 + i * 0.04, ease: EASE }}
                  className="group/row border-b border-white/5 transition-colors duration-300 hover:bg-white/[0.04]"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{stock.symbol}</div>
                        <div className="text-xs text-slate-500 max-w-[140px] truncate">{stock.name}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-400">
                    {stock.sector}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-white">
                    {formatPrice(stock.price)}
                  </td>

                  <td className="px-4 py-4 text-center font-bold text-white text-base">
                    {stock.aiScore}
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-slate-300">
                    {stock.pe}x
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-slate-300">
                    {stock.roe}%
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-emerald-400">
                    +{stock.revenueGrowth}%
                  </td>

                  <td className="px-4 py-4 text-right font-semibold text-slate-400">
                    {stock.debtEquity}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${badgeStyle}`}>
                      {stock.recommendation}
                    </span>
                  </td>

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

      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
      />
    </motion.div>
  );
}

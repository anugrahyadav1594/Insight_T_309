"use client";

import { Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { Filter, FilterMetric, OperatorType } from "./types";

const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

export const AVAILABLE_METRICS: FilterMetric[] = [
  { id: "aiScore", name: "AI Score", category: "AI Metrics", type: "number", placeholder: "e.g. 80" },
  { id: "pe", name: "P/E Ratio", category: "Valuation", type: "number", placeholder: "e.g. 25" },
  { id: "roe", name: "ROE (%)", category: "Financial", type: "number", placeholder: "e.g. 15" },
  { id: "revenueGrowth", name: "Revenue Growth (%)", category: "Growth", type: "number", placeholder: "e.g. 10" },
  { id: "epsGrowth", name: "EPS Growth (%)", category: "Growth", type: "number", placeholder: "e.g. 12" },
  { id: "debtEquity", name: "Debt to Equity", category: "Risk", type: "number", placeholder: "e.g. 0.5" },
  { id: "marketCap", name: "Market Cap", category: "Financial", type: "string", placeholder: "Large Cap, Mid Cap, Small Cap" },
  { id: "sector", name: "Sector", category: "Financial", type: "string", placeholder: "e.g. IT Services" },
];

interface FilterBuilderProps {
  filters: Filter[];
  onUpdateFilter: (id: string, updates: Partial<Filter>) => void;
  onRemoveFilter: (id: string) => void;
  onAddFilterClick: () => void;
}

export default function FilterBuilder({
  filters,
  onUpdateFilter,
  onRemoveFilter,
  onAddFilterClick,
}: FilterBuilderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Active Filter Conditions
        </h3>
        <motion.button
          onClick={onAddFilterClick}
          whileHover={{ scale: 1.04, transition: HOVER_SPRING }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Filter
        </motion.button>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-6 text-sm text-slate-500 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
          No active filter rules. Click "+ Add Filter" or select a preset above.
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter) => {
            const metric = AVAILABLE_METRICS.find((m) => m.id === filter.metricId) || AVAILABLE_METRICS[0];

            return (
              <motion.div
                key={filter.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3"
              >
                {/* Metric Selector */}
                <div className="flex-1 min-w-[150px] relative">
                  <select
                    value={filter.metricId}
                    onChange={(e) => onUpdateFilter(filter.id, { metricId: e.target.value })}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-black/40 pl-3 pr-10 py-2 text-sm text-white outline-none focus:border-cyan-400/50 [&>option]:bg-[#0B1220]"
                  >
                    {AVAILABLE_METRICS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                    <svg className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {/* Operator Selector */}
                <div className="w-24 relative">
                  <select
                    value={filter.operator}
                    onChange={(e) => onUpdateFilter(filter.id, { operator: e.target.value as OperatorType })}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-black/40 pl-3 pr-10 py-2 text-sm text-white outline-none focus:border-cyan-400/50 [&>option]:bg-[#0B1220]"
                  >
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="=">=</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                    <svg className="h-4 w-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {/* Input Value */}
                <div className="flex-1">
                  <input
                    type={metric.type === "number" ? "number" : "text"}
                    value={filter.value}
                    onChange={(e) =>
                      onUpdateFilter(filter.id, {
                        value: metric.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
                      })
                    }
                    placeholder={metric.placeholder}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  />
                </div>

                {/* Delete Button */}
                <motion.button
                  onClick={() => onRemoveFilter(filter.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

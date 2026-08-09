"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AVAILABLE_METRICS } from "./FilterBuilder";
import type { FilterMetric } from "./types";

interface AddFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMetric: (metric: FilterMetric) => void;
  activeMetricIds: string[];
}

export default function AddFilterModal({ isOpen, onClose, onSelectMetric, activeMetricIds }: AddFilterModalProps) {
  const [search, setSearch] = useState("");

  const categories = ["AI Metrics", "Financial", "Valuation", "Technical", "Growth", "Risk"] as const;

  const filteredMetrics = AVAILABLE_METRICS.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) && !activeMetricIds.includes(m.id)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="
              relative w-full max-w-lg rounded-3xl border border-white/10
              bg-gradient-to-b from-[#0c1324]/95 to-[#070b14]/95 p-6 shadow-2xl backdrop-blur-3xl z-10
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-100">Add Filter Metric</h3>
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-400 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search metrics..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-400 outline-none transition-all focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>

            {/* Categories & Items */}
            <div className="max-h-[350px] overflow-y-auto space-y-6 pr-2">
              {categories.map((cat) => {
                const items = filteredMetrics.filter((m) => m.category === cat);
                if (items.length === 0) return null;

                return (
                  <div key={cat} className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      {cat}
                    </h4>
                    <div className="grid gap-2 grid-cols-2">
                      {items.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            onSelectMetric(m);
                            onClose();
                          }}
                          className="
                            flex items-center justify-between rounded-xl border border-white/10
                            bg-white/5 px-4 py-3 text-left text-xs font-semibold text-slate-300
                            transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300
                          "
                        >
                          <span>{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import type { Preset } from "./types";

const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

export const PRESETS: Preset[] = [
  {
    id: "growth",
    name: "Growth",
    description: "High revenue, EPS growth & returns",
    filters: [
      { metricId: "revenueGrowth", operator: ">", value: 15 },
      { metricId: "epsGrowth", operator: ">", value: 15 },
      { metricId: "roe", operator: ">", value: 18 },
    ],
  },
  {
    id: "value",
    name: "Value",
    description: "Low P/E & low leverage",
    filters: [
      { metricId: "pe", operator: "<", value: 20 },
      { metricId: "debtEquity", operator: "<", value: 0.5 },
    ],
  },
  {
    id: "momentum",
    name: "Momentum",
    description: "Supercharged growth with high AI convictions",
    filters: [
      { metricId: "revenueGrowth", operator: ">", value: 25 },
      { metricId: "aiScore", operator: ">", value: 80 },
    ],
  },
  {
    id: "dividend",
    name: "Dividend",
    description: "Attractive P/E margins & high return index",
    filters: [
      { metricId: "pe", operator: "<", value: 15 },
      { metricId: "roe", operator: ">", value: 15 },
    ],
  },
  {
    id: "quality",
    name: "Quality",
    description: "Exceptional ROE metrics with minimal debt load",
    filters: [
      { metricId: "roe", operator: ">", value: 25 },
      { metricId: "debtEquity", operator: "<", value: 0.2 },
    ],
  },
  {
    id: "lowRisk",
    name: "Low Risk",
    description: "Safe leverage ratios & strong AI score security",
    filters: [
      { metricId: "debtEquity", operator: "<", value: 0.3 },
      { metricId: "aiScore", operator: ">", value: 75 },
    ],
  },
  {
    id: "largeCap",
    name: "Large Cap",
    description: "Filter by Large Cap blue chips",
    filters: [{ metricId: "marketCap", operator: "=", value: "Large Cap" }],
  },
  {
    id: "midCap",
    name: "Mid Cap",
    description: "Filter by Mid Cap high growth stocks",
    filters: [{ metricId: "marketCap", operator: "=", value: "Mid Cap" }],
  },
];

interface QuickPresetsProps {
  selectedPreset: string | null;
  onSelectPreset: (presetId: string) => void;
  customPresets?: string[];
  onDeletePreset?: (name: string) => void;
  onEditPreset?: (name: string) => void;
}

export default function QuickPresets({
  selectedPreset,
  onSelectPreset,
  customPresets = [],
  onDeletePreset,
  onEditPreset,
}: QuickPresetsProps) {
  return (
    <div className="space-y-4">
      {/* Quick Presets */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Quick Presets
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {PRESETS.map((preset) => (
            <motion.button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              whileHover={{ scale: 1.05, transition: HOVER_SPRING }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all duration-300 ${
                selectedPreset === preset.id
                  ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
              }`}
            >
              {preset.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Saved Screens with hover actions */}
      {customPresets.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Saved Screens (Local)
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {customPresets.map((name) => {
              const isSelected = selectedPreset === name;
              return (
                <div
                  key={name}
                  className="relative group/custom"
                >
                  <motion.button
                    onClick={() => onSelectPreset(name)}
                    whileHover={{ scale: 1.05, transition: HOVER_SPRING }}
                    whileTap={{ scale: 0.95 }}
                    className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all duration-300 ${
                      isSelected
                        ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/10"
                        : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                    }`}
                  >
                    {name}
                  </motion.button>

                  {/* Hover overlay: edit & delete buttons */}
                  <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover/custom:opacity-100 transition-opacity duration-200 pointer-events-none group-hover/custom:pointer-events-auto">
                    {/* Edit */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditPreset?.(name);
                      }}
                      className="p-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                      title="Edit preset filters"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePreset?.(name);
                      }}
                      className="p-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Delete preset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

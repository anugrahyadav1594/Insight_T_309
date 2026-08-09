"use client";

import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import type { Preset } from "./types";

const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

export const PRESETS: Preset[] = [];

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
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Saved Screener Profiles
      </h3>

      {customPresets.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {customPresets.map((name) => {
            const isSelected = selectedPreset === name;
            return (
              <div key={name} className="relative group/custom">
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
      ) : (
        <p className="text-xs text-slate-400">
          No saved screener profiles yet. Add custom filters below and click <strong className="text-slate-200">"Save Screen"</strong> to create your first screener profile.
        </p>
      )}
    </div>
  );
}

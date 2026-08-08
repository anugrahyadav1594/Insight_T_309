"use client";

import { useState, useEffect } from "react";
import { X, Bookmark, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SaveScreenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  editingName?: string | null; // if provided, we are editing an existing preset
}

export default function SaveScreenDialog({ isOpen, onClose, onSave, editingName }: SaveScreenDialogProps) {
  const [screenName, setScreenName] = useState("");
  const isEditing = !!editingName;

  // When editingName changes, prefill the input
  useEffect(() => {
    if (isOpen && editingName) {
      setScreenName(editingName);
    } else if (isOpen && !editingName) {
      setScreenName("");
    }
  }, [isOpen, editingName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (screenName.trim()) {
      onSave(screenName.trim());
      setScreenName("");
      onClose();
    }
  };

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

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="
              relative w-full max-w-sm rounded-3xl border border-white/10
              bg-[#0b1220] p-6 shadow-2xl backdrop-blur-3xl z-10
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Pencil className="h-5 w-5 text-cyan-400" />
                    Update Preset
                  </>
                ) : (
                  <>
                    <Bookmark className="h-5 w-5 text-cyan-400" />
                    Save Current Screen
                  </>
                )}
              </h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Preset Name
                </label>
                <input
                  type="text"
                  required
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  placeholder="e.g. High Growth Stocks"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
                />
                {isEditing && (
                  <p className="mt-1 text-xs text-slate-500">Edit the name if you wish, or keep it the same.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/10"
                >
                  {isEditing ? "Update Preset" : "Save Preset"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

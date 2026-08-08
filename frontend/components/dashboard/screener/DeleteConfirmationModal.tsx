"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    presetName: string;
}

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    presetName,
}: DeleteConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="
              relative
              w-full
              max-w-md
              rounded-3xl
              border
              border-white/10
              bg-[#0B1220]
              p-6
              shadow-2xl
              backdrop-blur-3xl
              z-10
            "
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                            <h3 className="text-xl font-bold text-white">Delete Preset</h3>
                        </div>

                        <p className="text-slate-300 mb-6">
                            Are you sure you want to delete the preset "<span className="font-semibold text-white">{presetName}</span>"? This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 font-semibold text-slate-300 transition hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className="flex-1 rounded-xl bg-red-500 py-2.5 font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, BrainCircuit, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle } from "lucide-react";

interface AIAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AIAnalysisModal({ isOpen, onClose }: AIAnalysisModalProps) {
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
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="
              relative
              w-full
              max-w-2xl
              rounded-3xl
              border
              border-white/10
              bg-[#0B1220]
              p-8
              shadow-2xl
              backdrop-blur-3xl
              z-10
            "
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                            <BrainCircuit className="h-6 w-6 text-cyan-400" />
                            <h3 className="text-xl font-bold text-white">AI Portfolio Analysis</h3>
                        </div>

                        <div className="space-y-6 text-slate-300">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <ShieldCheck className="h-5 w-5" />
                                        <span className="font-semibold">Risk Assessment</span>
                                    </div>
                                    <p className="mt-2 text-sm">Your portfolio has a <span className="font-bold text-white">moderate</span> risk profile (52/100).</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <TrendingUp className="h-5 w-5" />
                                        <span className="font-semibold">Top Performer</span>
                                    </div>
                                    <p className="mt-2 text-sm"><span className="font-bold text-white">INFY</span> with +62.33% return</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-red-400">
                                        <TrendingDown className="h-5 w-5" />
                                        <span className="font-semibold">Bottom Performer</span>
                                    </div>
                                    <p className="mt-2 text-sm"><span className="font-bold text-white">LT</span> with -40.41% return</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <AlertTriangle className="h-5 w-5" />
                                        <span className="font-semibold">Recommendation</span>
                                    </div>
                                    <p className="mt-2 text-sm">Consider rebalancing to reduce exposure to underperformers.</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                                <p className="text-sm text-cyan-300">
                                    💡 Insight: Your portfolio shows strong growth potential but has concentration risk in IT stocks. Diversifying into other sectors could improve risk-adjusted returns.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={onClose}
                                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-105"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
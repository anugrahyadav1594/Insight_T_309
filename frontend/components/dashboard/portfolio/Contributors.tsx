"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Holding } from "@/lib/portfolioData";
import { calcPnL } from "@/lib/portfolioData";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

function formatCurrency(amount: number): string {
    const abs = Math.abs(amount);
    if (abs >= 100000) {
        return `₹${(abs / 100000).toFixed(2)}L`;
    }
    if (abs >= 1000) {
        return `₹${(abs / 1000).toFixed(1)}K`;
    }
    return `₹${abs.toFixed(0)}`;
}

interface ContributorRowProps {
    holding: Holding;
    rank: number;
    isTop: boolean;
    totalValue: number;
}

function ContributorRow({ holding, rank, isTop, totalValue }: ContributorRowProps) {
    const pnl = calcPnL(holding);
    const isPositive = pnl.amount >= 0;
    const weightPercent = ((holding.current * holding.qty) / totalValue) * 100;

    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + rank * 0.06, ease: EASE }}
            whileHover={{ x: 4, transition: HOVER_SPRING }}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors duration-300 hover:border-cyan-400/30 hover:bg-white/10"
        >
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold bg-white/5 text-slate-400 border border-white/10">
                    #{rank}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{holding.symbol}</span>
                        <span className="text-xs text-slate-500">{holding.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className={`font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                            {isPositive ? "+" : ""}{pnl.percent.toFixed(2)}%
                        </span>
                        <span className="text-slate-500">
                            {formatCurrency(pnl.amount)} • {weightPercent.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                {isTop ? (
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                    {isPositive ? "+" : ""}{formatCurrency(pnl.amount)}
                </span>
            </div>
        </motion.div>
    );
}

interface ContributorsProps {
    topContributors: Holding[];
    bottomLaggards: Holding[];
    totalValue: number;
}

export default function Contributors({
    topContributors,
    bottomLaggards,
    totalValue,
}: ContributorsProps) {
    return (
        <div className="mt-8 grid gap-16 md:grid-cols-2">
            {/* Top Contributors */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
                className="
          group
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-white/10
          bg-white/5
          p-6
          backdrop-blur-3xl
          shadow-2xl
          transition-colors
          duration-500
          ease-out
          hover:border-emerald-500/30
        "
            >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
                    <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[100px]" />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">Top Contributors</h4>
                    </div>

                    <div className="space-y-3">
                        {topContributors.length > 0 ? (
                            topContributors.map((h, i) => (
                                <ContributorRow
                                    key={h.symbol}
                                    holding={h}
                                    rank={i + 1}
                                    isTop={true}
                                    totalValue={totalValue}
                                />
                            ))
                        ) : (
                            <div className="text-center text-sm text-slate-500 py-6">
                                No positive contributors yet
                            </div>
                        )}
                    </div>
                </div>

                <motion.div
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-emerald-500 to-teal-500"
                />
            </motion.div>

            {/* Bottom Laggards */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
                className="
          group
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-white/10
          bg-white/5
          p-6
          backdrop-blur-3xl
          shadow-2xl
          transition-colors
          duration-500
          ease-out
          hover:border-red-500/30
        "
            >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
                    <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-red-500/15 blur-[100px]" />
                </div>

                <div className="relative">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                        <TrendingDown className="h-5 w-5 text-red-400" />
                        <h4 className="text-sm font-bold text-white">Bottom Laggards</h4>
                    </div>

                    <div className="space-y-3">
                        {bottomLaggards.length > 0 ? (
                            bottomLaggards.map((h, i) => (
                                <ContributorRow
                                    key={h.symbol}
                                    holding={h}
                                    rank={i + 1}
                                    isTop={false}
                                    totalValue={totalValue}
                                />
                            ))
                        ) : (
                            <div className="text-center text-sm text-slate-500 py-6">
                                No negative performers
                            </div>
                        )}
                    </div>
                </div>

                <motion.div
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-red-500 to-pink-500"
                />
            </motion.div>
        </div>
    );
}
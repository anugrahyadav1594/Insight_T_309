"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as LucidePieChart } from "lucide-react";
import type { Holding } from "@/lib/portfolioData";

const COLORS = ["#22D3EE", "#60A5FA", "#34D399", "#FBBF24", "#F472B6", "#A78BFA", "#F87171", "#34D399"];

interface HoldingsChartProps {
    holdings: Holding[];
    totalValue: number;
}

export default function HoldingsChart({ holdings, totalValue }: HoldingsChartProps) {
    const data = holdings.map((h) => ({
        name: h.symbol,
        value: (h.current * h.qty / totalValue) * 100,
        fullName: h.name,
    }));

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="
        group
        relative
        mt-16
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
        hover:border-cyan-400/40
      "
        >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
                <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
            </div>

            <div className="relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                        <LucidePieChart className="h-5 w-5 text-cyan-400" />
                        <h4 className="text-sm font-bold text-white">Holdings by weight</h4>
                    </div>
                    <span className="text-xs text-slate-500">{holdings.length} stocks</span>
                </div>

                <div className="flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="transparent"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: "rgba(11, 18, 32, 0.9)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "12px",
                                    color: "white",
                                }}
                                formatter={(value) => {
                                    if (typeof value === 'number') return `${value.toFixed(1)}%`;
                                    return `${value || 0}%`;
                                }}
                                labelFormatter={(label) => `${label}`}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                        {data.map((item, idx) => (
                            <div key={item.name} className="flex items-center gap-1.5">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                />
                                <span className="text-xs text-slate-300">
                                    {item.name} ({item.value.toFixed(1)}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <motion.div
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
            />
        </motion.div>
    );
}
"use client";

import { motion } from "framer-motion";
import { Eye, TrendingUp, TrendingDown, Bell } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

interface WatchlistStatsProps {
  total: number;
  bullish: number;
  bearish: number;
  alerts: number;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  index: number;
  accentColor: string;
}

function StatCard({ title, value, icon: Icon, index, accentColor }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE }}
      whileHover={{ y: -8, scale: 1.02, transition: HOVER_SPRING }}
      className="
        group relative overflow-hidden rounded-[32px] border border-white/10
        bg-white/5 p-6 backdrop-blur-3xl transition-colors duration-500
        ease-out transform-gpu will-change-transform hover:border-cyan-400/40
      "
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative flex items-center justify-between text-slate-400">
        <span className="text-sm font-medium text-slate-300">{title}</span>
        <motion.div
          whileHover={{ rotate: 8 }}
          transition={{ duration: 0.4, ease: EASE }}
          className={`rounded-xl p-2 ${accentColor}`}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 text-3xl font-extrabold text-white">{value}</div>

      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
      />
    </motion.div>
  );
}

export default function WatchlistStats({ total, bullish, bearish, alerts }: WatchlistStatsProps) {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Watching"
        value={`${total} Stocks`}
        icon={Eye}
        index={0}
        accentColor="bg-cyan-500/10 text-cyan-400"
      />
      <StatCard
        title="Bullish"
        value={`${bullish}`}
        icon={TrendingUp}
        index={1}
        accentColor="bg-emerald-500/10 text-emerald-400"
      />
      <StatCard
        title="Bearish"
        value={`${bearish}`}
        icon={TrendingDown}
        index={2}
        accentColor="bg-red-500/10 text-red-400"
      />
      <StatCard
        title="Alerts"
        value={`${alerts}`}
        icon={Bell}
        index={3}
        accentColor="bg-amber-500/10 text-amber-400"
      />
    </div>
  );
}

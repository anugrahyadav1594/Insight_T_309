"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Activity,
  Zap,
} from "lucide-react";

interface Props {
  onLanding: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

export default function DashboardHome({ onLanding, onNavigateToTab }: Props) {
  return (
    <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-8">
        {/* Header Bar - removed arrows */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-300 backdrop-blur-xl">
            <Sparkles className="h-4 w-4" />
            AI Intelligence Workspace
          </div>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            Investment{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="mt-1 text-slate-400">
            Welcome back, <span className="text-white font-medium">demo@insight.ai</span>! Here is your AI market intelligence breakdown.
          </p>
        </div>

        {/* Top Search & AI Prompt Bar */}
        <div className="mt-10 rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-6 backdrop-blur-3xl shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock, ticker, or ask AI (e.g. 'Analyze Reliance Industries earnings')"
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-cyan-400/50"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.04, transition: HOVER_SPRING }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/25"
            >
              <Zap className="h-4 w-4" />
              Ask Insight AI
            </motion.button>
          </div>
        </div>

        {/* Quick Key Metrics */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Portfolio Value"
            value="₹12,48,500"
            change="+14.2% YTD"
            isPositive={true}
            icon={DollarSign}
            index={0}
          />
          <MetricCard
            title="AI Confidence Score"
            value="89 / 100"
            change="High Conviction"
            isPositive={true}
            icon={BrainCircuit}
            index={1}
          />
          <MetricCard
            title="Risk Health Score"
            value="24 / 100"
            change="Low Risk Profile"
            isPositive={true}
            icon={ShieldCheck}
            index={2}
          />
          <MetricCard
            title="Active Watchlist"
            value="18 Tickers"
            change="3 Signals Alert"
            isPositive={true}
            icon={Activity}
            index={3}
          />
        </div>

        {/* Main Workspace Grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Main AI Stock Insight Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            whileHover={{
              y: -8,
              scale: 1.01,
              transition: HOVER_SPRING,
            }}
            className="
              group
              relative
              overflow-hidden
              rounded-[32px]
              border
              border-white/10
              bg-white/5
              p-8
              backdrop-blur-3xl
              lg:col-span-8
              shadow-2xl
              transition-colors
              duration-500
              ease-out
              transform-gpu
              will-change-transform
              hover:border-cyan-400/40
            "
          >
            {/* Hover Glow */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
              <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
            </div>

            <div className="relative flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Featured AI Recommendation
                </span>
                <h3 className="mt-1 text-2xl font-bold text-white">
                  TCS (Tata Consultancy Services)
                </h3>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1.5 text-xs font-bold text-emerald-400">
                STRONG BUY
              </span>
            </div>

            <p className="relative mt-4 leading-7 text-slate-300">
              Insight AI evaluated Q4 revenue growth (+11.8% YoY), cloud margin expansions, and management's upbeat order book. Valuation models confirm attractive risk-reward entry at current levels.
            </p>

            <div className="relative mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors duration-300 hover:border-cyan-400/30">
                <div className="text-xs text-slate-400">Fundamental Score</div>
                <div className="mt-1 text-2xl font-bold text-cyan-400">94 / 100</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors duration-300 hover:border-cyan-400/30">
                <div className="text-xs text-slate-400">Technical Momentum</div>
                <div className="mt-1 text-2xl font-bold text-blue-400">88 / 100</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors duration-300 hover:border-cyan-400/30">
                <div className="text-xs text-slate-400">Target upside</div>
                <div className="mt-1 text-2xl font-bold text-emerald-400">+18.5%</div>
              </div>
            </div>

            {/* Bottom Accent */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
            />
          </motion.div>

          {/* Right AI Signals / Watchlist Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            whileHover={{
              y: -8,
              scale: 1.01,
              transition: HOVER_SPRING,
            }}
            className="
              group
              relative
              overflow-hidden
              rounded-[32px]
              border
              border-white/10
              bg-white/5
              p-8
              backdrop-blur-3xl
              lg:col-span-4
              flex
              flex-col
              justify-between
              transition-colors
              duration-500
              ease-out
              transform-gpu
              will-change-transform
              hover:border-cyan-400/40
            "
          >
            {/* Hover Glow */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
              <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
            </div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">Live AI Signals</h4>
                <motion.div
                  whileHover={{ rotate: 8 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <BarChart3 className="h-5 w-5 text-cyan-400" />
                </motion.div>
              </div>
              <p className="mt-1 text-xs text-slate-400">Real-time explainable insights</p>

              <div className="mt-6 space-y-4">
                <SignalRow ticker="RELIANCE" signal="ACCUMULATE" score="86" />
                <SignalRow ticker="INFY" signal="HOLD" score="72" />
                <SignalRow ticker="HDFCBANK" signal="BUY" score="91" />
                <SignalRow ticker="ICICIBANK" signal="BUY" score="89" />
              </div>
            </div>

            <motion.button
              onClick={() => onNavigateToTab?.("screener")}
              whileHover={{ scale: 1.02, transition: HOVER_SPRING }}
              whileTap={{ scale: 0.98 }}
              className="relative mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400/30 transition"
            >
              Explore Full Screener <ArrowUpRight className="h-4 w-4" />
            </motion.button>

            {/* Bottom Accent */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  index,
}: {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ElementType;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: HOVER_SPRING,
      }}
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
        transition-colors
        duration-500
        ease-out
        transform-gpu
        will-change-transform
        hover:border-cyan-400/40
      "
    >
      {/* Hover Glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative flex items-center justify-between text-slate-400">
        <span className="text-sm font-medium text-slate-300">{title}</span>
        <motion.div
          whileHover={{ rotate: 8 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400"
        >
          <Icon className="h-5 w-5" />
        </motion.div>
      </div>

      <div className="relative mt-4 text-3xl font-extrabold text-white">{value}</div>

      <div
        className={`relative mt-2 text-xs font-semibold ${
          isPositive ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {change}
      </div>

      {/* Bottom Accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
      />
    </motion.div>
  );
}

function SignalRow({
  ticker,
  signal,
  score,
}: {
  ticker: string;
  signal: string;
  score: string;
}) {
  return (
    <motion.div
      whileHover={{ x: 4, transition: HOVER_SPRING }}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-colors duration-300 hover:border-cyan-400/30 hover:bg-white/10"
    >
      <div>
        <div className="font-bold text-white text-sm">{ticker}</div>
        <div className="text-xs text-slate-400">Score: {score}/100</div>
      </div>
      <span
        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
          signal === "BUY" || signal === "ACCUMULATE"
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
        }`}
      >
        {signal}
      </span>
    </motion.div>
  );
}

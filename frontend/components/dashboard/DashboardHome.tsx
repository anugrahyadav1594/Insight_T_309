"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { getDashboard } from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { DashboardResponse } from "@/lib/types";
import IpoCalendarCard from "./IpoCalendarCard";
import MarketMoversCard from "./MarketMoversCard";

interface Props {
  onLanding: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

function formatCurrency(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}

const MOCK_DASHBOARD_DATA: DashboardResponse = {
  portfolio_summary: {
    portfolio_count: 1,
    total_value: 1245000,
    total_invested: 980000,
    total_pl: 265000,
    total_pl_pct: 27.04,
    holdings_count: 5,
  },
  portfolio_scores: {
    fundamental: 82,
    technical: 78,
    risk: 65,
    overall: 84,
    confidence: 0.88,
  },
  risk_health: {
    score: 72,
    label: "Optimal Balance",
    top_risks: ["Sector concentration in IT", "Small-cap volatility"],
  },
  watchlist: {
    count: 12,
    alerts: [
      { ticker: "INFY", signal: "BULLISH", reason: "Strong Q3 earnings beat", at: new Date().toISOString() },
      { ticker: "TCS", signal: "ACCUMULATE", reason: "Healthy order book growth", at: new Date().toISOString() },
    ],
  },
  featured_insight: {
    ticker: "INFY",
    name: "Infosys Ltd",
    overall_score: 88,
    recommendation: "STRONG_BUY",
    confidence: 0.91,
    ai_summary: "Infosys demonstrates robust revenue momentum, industry-leading operating margins, and strong deal wins in cloud transformation. Valuation remains attractive with high ROE.",
  },
  signals: [
    { ticker: "INFY", action: "STRONG_BUY", score: 88, confidence: 0.91, driver: "Cloud deal wins" },
    { ticker: "TCS", action: "BUY", score: 84, confidence: 0.85, driver: "Margin expansion" },
    { ticker: "RELIANCE", action: "ACCUMULATE", score: 82, confidence: 0.82, driver: "Retail revenue growth" },
    { ticker: "HDFCBANK", action: "HOLD", score: 75, confidence: 0.78, driver: "NIM stabilization" },
  ],
  generated_at: new Date().toISOString(),
};

export default function DashboardHome({ onLanding, onNavigateToTab }: Props) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboard()
      .then((res: DashboardResponse) => {
        if (!cancelled) {
          setData(res);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(MOCK_DASHBOARD_DATA);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Derive display values from API data or show defaults
  const portfolioValue = data ? formatCurrency(data.portfolio_summary.total_value) : "—";
  const portfolioChange = data
    ? `${data.portfolio_summary.total_pl_pct >= 0 ? "+" : ""}${data.portfolio_summary.total_pl_pct.toFixed(1)}% Total`
    : "—";
  const aiScore = data?.portfolio_scores.overall != null
    ? `${Math.round(data.portfolio_scores.overall)} / 100`
    : "— / 100";
  const aiConfidence = data?.portfolio_scores.confidence != null
    ? (data.portfolio_scores.confidence >= 0.7 ? "High Conviction" : data.portfolio_scores.confidence >= 0.4 ? "Medium Conviction" : "Low Conviction")
    : "—";
  const riskScore = data?.risk_health
    ? `${Math.round(data.risk_health.score)} / 100`
    : "— / 100";
  const riskLabel = data?.risk_health?.label || "—";
  const watchlistCount = data?.watchlist
    ? `${data.watchlist.count} Tickers`
    : "— Tickers";
  const watchlistAlerts = data?.watchlist
    ? `${data.watchlist.alerts.length} Signals Alert`
    : "—";

  // Featured insight
  const featured = data?.featured_insight;
  const signals = data?.signals || [];

  const displayEmail = user?.email || "your workspace";

  return (
    <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-8">
        {/* Header Bar */}
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
            Welcome back, <span className="text-white font-medium">{displayEmail}</span>! Here is your AI market intelligence breakdown.
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

        {/* Loading state */}
        {loading && (
          <div className="mt-16 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm">Loading your dashboard...</p>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {/* Quick Key Metrics */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Portfolio Value"
                value={portfolioValue}
                change={portfolioChange}
                isPositive={data ? data.portfolio_summary.total_pl_pct >= 0 : true}
                icon={DollarSign}
                index={0}
              />
              <MetricCard
                title="AI Confidence Score"
                value={aiScore}
                change={aiConfidence}
                isPositive={true}
                icon={BrainCircuit}
                index={1}
              />
              <MetricCard
                title="Risk Health Score"
                value={riskScore}
                change={riskLabel}
                isPositive={true}
                icon={ShieldCheck}
                index={2}
              />
              <MetricCard
                title="Active Watchlist"
                value={watchlistCount}
                change={watchlistAlerts}
                isPositive={true}
                icon={Activity}
                index={3}
              />
            </div>

            {/* Main Workspace Grid */}
            <div className="mt-8 grid gap-8 lg:grid-cols-12">
              {/* IPO Intelligence Calendar Card */}
              <IpoCalendarCard />

              {/* Market Movers Card (Gains & Losses) */}
              <MarketMoversCard onNavigateToTab={onNavigateToTab} />
            </div>
          </>
        )}
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
          signal === "BUY" || signal === "ACCUMULATE" || signal === "STRONG_BUY"
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            : signal === "BEARISH"
            ? "bg-red-500/15 text-red-400 border border-red-500/30"
            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
        }`}
      >
        {signal}
      </span>
    </motion.div>
  );
}

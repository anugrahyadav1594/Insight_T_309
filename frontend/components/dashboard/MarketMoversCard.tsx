"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight, BarChart2 } from "lucide-react";
import { getMovers } from "@/lib/api";
import type { MoverItem, MoverDirection, PeriodCode } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

const TIMEFRAMES: { label: string; value: PeriodCode }[] = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "1M", value: "1M" },
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
];

// Rich fallback dataset per period & direction
const MOCK_MOVERS_DATA: Record<PeriodCode, Record<MoverDirection, MoverItem[]>> = {
  "1D": {
    gainers: [
      { ticker: "TATAMOTORS", name: "Tata Motors Ltd", exchange: "NSE", sector: "Automobiles", price: 980, change_pct: 4.85, change: 45.3, direction: "gainers", period: "1D" },
      { ticker: "INFY", name: "Infosys Ltd", exchange: "NSE", sector: "IT Services", price: 1480, change_pct: 3.42, change: 48.9, direction: "gainers", period: "1D" },
      { ticker: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "IT Services", price: 3725, change_pct: 2.76, change: 100.1, direction: "gainers", period: "1D" },
      { ticker: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE", sector: "Telecom", price: 1550, change_pct: 2.18, change: 33.1, direction: "gainers", period: "1D" },
    ],
    losers: [
      { ticker: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Engineering", price: 3580, change_pct: -3.85, change: -143.2, direction: "losers", period: "1D" },
      { ticker: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE", sector: "Banking", price: 1650, change_pct: -2.40, change: -40.5, direction: "losers", period: "1D" },
      { ticker: "RELIANCE", name: "Reliance Industries", exchange: "NSE", sector: "Energy", price: 2920, change_pct: -1.75, change: -52.0, direction: "losers", period: "1D" },
      { ticker: "WIPRO", name: "Wipro Ltd", exchange: "NSE", sector: "IT Services", price: 500, change_pct: -1.22, change: -6.15, direction: "losers", period: "1D" },
    ],
  },
  "1W": {
    gainers: [
      { ticker: "ZOMATO", name: "Zomato Ltd", exchange: "NSE", sector: "E-Commerce", price: 250, change_pct: 8.92, change: 20.5, direction: "gainers", period: "1W" },
      { ticker: "TATAMOTORS", name: "Tata Motors Ltd", exchange: "NSE", sector: "Automobiles", price: 980, change_pct: 6.40, change: 58.9, direction: "gainers", period: "1W" },
      { ticker: "INFY", name: "Infosys Ltd", exchange: "NSE", sector: "IT Services", price: 1480, change_pct: 5.12, change: 72.1, direction: "gainers", period: "1W" },
      { ticker: "TITAN", name: "Titan Company Ltd", exchange: "NSE", sector: "Retail", price: 3400, change_pct: 4.30, change: 140.0, direction: "gainers", period: "1W" },
    ],
    losers: [
      { ticker: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Engineering", price: 3580, change_pct: -5.60, change: -212.0, direction: "losers", period: "1W" },
      { ticker: "ASIANPAINT", name: "Asian Paints Ltd", exchange: "NSE", sector: "Paints", price: 2800, change_pct: -3.90, change: -113.5, direction: "losers", period: "1W" },
      { ticker: "MARUTI", name: "Maruti Suzuki Ltd", exchange: "NSE", sector: "Automobiles", price: 11500, change_pct: -2.80, change: -331.0, direction: "losers", period: "1W" },
      { ticker: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE", sector: "Banking", price: 1650, change_pct: -2.10, change: -35.4, direction: "losers", period: "1W" },
    ],
  },
  "1M": {
    gainers: [
      { ticker: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE", sector: "Telecom", price: 1550, change_pct: 12.80, change: 176.0, direction: "gainers", period: "1M" },
      { ticker: "ZOMATO", name: "Zomato Ltd", exchange: "NSE", sector: "E-Commerce", price: 250, change_pct: 11.45, change: 25.7, direction: "gainers", period: "1M" },
      { ticker: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "IT Services", price: 3725, change_pct: 9.30, change: 317.0, direction: "gainers", period: "1M" },
      { ticker: "ICICIBANK", name: "ICICI Bank Ltd", exchange: "NSE", sector: "Banking", price: 1080, change_pct: 7.60, change: 76.3, direction: "gainers", period: "1M" },
    ],
    losers: [
      { ticker: "NESTLEIND", name: "Nestle India Ltd", exchange: "NSE", sector: "FMCG", price: 2450, change_pct: -6.40, change: -167.0, direction: "losers", period: "1M" },
      { ticker: "HINDUNILVR", name: "Hindustan Unilever", exchange: "NSE", sector: "FMCG", price: 2460, change_pct: -4.80, change: -124.0, direction: "losers", period: "1M" },
      { ticker: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Engineering", price: 3580, change_pct: -4.20, change: -156.8, direction: "losers", period: "1M" },
      { ticker: "WIPRO", name: "Wipro Ltd", exchange: "NSE", sector: "IT Services", price: 500, change_pct: -3.10, change: -16.0, direction: "losers", period: "1M" },
    ],
  },
  "3M": {
    gainers: [
      { ticker: "TATAMOTORS", name: "Tata Motors Ltd", exchange: "NSE", sector: "Automobiles", price: 980, change_pct: 22.40, change: 179.5, direction: "gainers", period: "3M" },
      { ticker: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE", sector: "Telecom", price: 1550, change_pct: 18.60, change: 243.0, direction: "gainers", period: "3M" },
      { ticker: "INFY", name: "Infosys Ltd", exchange: "NSE", sector: "IT Services", price: 1480, change_pct: 14.20, change: 184.0, direction: "gainers", period: "3M" },
      { ticker: "ZOMATO", name: "Zomato Ltd", exchange: "NSE", sector: "E-Commerce", price: 250, change_pct: 13.80, change: 30.3, direction: "gainers", period: "3M" },
    ],
    losers: [
      { ticker: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Engineering", price: 3580, change_pct: -9.80, change: -389.0, direction: "losers", period: "3M" },
      { ticker: "NESTLEIND", name: "Nestle India Ltd", exchange: "NSE", sector: "FMCG", price: 2450, change_pct: -8.10, change: -216.0, direction: "losers", period: "3M" },
      { ticker: "ASIANPAINT", name: "Asian Paints Ltd", exchange: "NSE", sector: "Paints", price: 2800, change_pct: -7.30, change: -220.0, direction: "losers", period: "3M" },
      { ticker: "RELIANCE", name: "Reliance Industries", exchange: "NSE", sector: "Energy", price: 2920, change_pct: -5.40, change: -166.0, direction: "losers", period: "3M" },
    ],
  },
  "6M": {
    gainers: [
      { ticker: "ZOMATO", name: "Zomato Ltd", exchange: "NSE", sector: "E-Commerce", price: 250, change_pct: 35.80, change: 66.0, direction: "gainers", period: "6M" },
      { ticker: "TATAMOTORS", name: "Tata Motors Ltd", exchange: "NSE", sector: "Automobiles", price: 980, change_pct: 31.20, change: 232.0, direction: "gainers", period: "6M" },
      { ticker: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE", sector: "Telecom", price: 1550, change_pct: 27.50, change: 334.0, direction: "gainers", period: "6M" },
      { ticker: "ICICIBANK", name: "ICICI Bank Ltd", exchange: "NSE", sector: "Banking", price: 1080, change_pct: 19.40, change: 175.0, direction: "gainers", period: "6M" },
    ],
    losers: [
      { ticker: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Engineering", price: 3580, change_pct: -14.50, change: -607.0, direction: "losers", period: "6M" },
      { ticker: "ASIANPAINT", name: "Asian Paints Ltd", exchange: "NSE", sector: "Paints", price: 2800, change_pct: -11.20, change: -353.0, direction: "losers", period: "6M" },
      { ticker: "NESTLEIND", name: "Nestle India Ltd", exchange: "NSE", sector: "FMCG", price: 2450, change_pct: -9.80, change: -266.0, direction: "losers", period: "6M" },
      { ticker: "WIPRO", name: "Wipro Ltd", exchange: "NSE", sector: "IT Services", price: 500, change_pct: -7.50, change: -40.5, direction: "losers", period: "6M" },
    ],
  },
  "1Y": {
    gainers: [
      { ticker: "ZOMATO", name: "Zomato Ltd", exchange: "NSE", sector: "E-Commerce", price: 250, change_pct: 62.30, change: 95.8, direction: "gainers", period: "1Y" },
      { ticker: "TATAMOTORS", name: "Tata Motors Ltd", exchange: "NSE", sector: "Automobiles", price: 980, change_pct: 48.60, change: 320.0, direction: "gainers", period: "1Y" },
      { ticker: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE", sector: "Telecom", price: 1550, change_pct: 41.20, change: 452.0, direction: "gainers", period: "1Y" },
      { ticker: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "IT Services", price: 3725, change_pct: 26.50, change: 780.0, direction: "gainers", period: "1Y" },
    ],
    losers: [
      { ticker: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Engineering", price: 3580, change_pct: -18.90, change: -834.0, direction: "losers", period: "1Y" },
      { ticker: "ASIANPAINT", name: "Asian Paints Ltd", exchange: "NSE", sector: "Paints", price: 2800, change_pct: -15.40, change: -510.0, direction: "losers", period: "1Y" },
      { ticker: "NESTLEIND", name: "Nestle India Ltd", exchange: "NSE", sector: "FMCG", price: 2450, change_pct: -12.30, change: -343.0, direction: "losers", period: "1Y" },
      { ticker: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE", sector: "Banking", price: 1650, change_pct: -8.60, change: -155.0, direction: "losers", period: "1Y" },
    ],
  },
};

interface MarketMoversCardProps {
  onNavigateToTab?: (tab: string) => void;
}

export default function MarketMoversCard({ onNavigateToTab }: MarketMoversCardProps) {
  const [direction, setDirection] = useState<MoverDirection>("gainers");
  const [period, setPeriod] = useState<PeriodCode>("1D");
  const [movers, setMovers] = useState<MoverItem[]>(MOCK_MOVERS_DATA["1D"]["gainers"]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getMovers(period, direction, 6)
      .then((res) => {
        if (!cancelled && res && res.items && res.items.length > 0) {
          setMovers(res.items);
        } else if (!cancelled) {
          setMovers(MOCK_MOVERS_DATA[period][direction]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMovers(MOCK_MOVERS_DATA[period][direction]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period, direction]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
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
        lg:col-span-4
        flex
        flex-col
        justify-between
        shadow-2xl
        transition-colors
        duration-500
        ease-out
        transform-gpu
        hover:border-cyan-400/40
      "
    >
      {/* Hover Glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <div className="relative">
        {/* Card Title & Icon */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-white">Market Movers</h4>
            <p className="mt-0.5 text-xs text-slate-400">Top performance breakdown</p>
          </div>

          {/* Direction Toggle Pills with Framer Motion Sliding Pill */}
          <div className="relative flex items-center rounded-xl border border-white/10 bg-black/40 p-1">
            <button
              onClick={() => setDirection("gainers")}
              className={`relative flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                direction === "gainers" ? "text-emerald-400" : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingUp className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">Gainers</span>
              {direction === "gainers" && (
                <motion.div
                  layoutId="mover-direction-bg"
                  className="absolute inset-0 rounded-lg bg-emerald-500/20 border border-emerald-500/30 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => setDirection("losers")}
              className={`relative flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                direction === "losers" ? "text-red-400" : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingDown className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">Losers</span>
              {direction === "losers" && (
                <motion.div
                  layoutId="mover-direction-bg"
                  className="absolute inset-0 rounded-lg bg-red-500/20 border border-red-500/30 shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Timeframe Selector Pills with Framer Motion Sliding Pill */}
        <div className="relative mt-4 flex items-center justify-between gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl">
          {TIMEFRAMES.map((tf) => {
            const isSelected = period === tf.value;
            return (
              <button
                key={tf.value}
                onClick={() => setPeriod(tf.value)}
                className={`relative flex-1 py-1 text-center text-xs font-bold transition-colors duration-200 ${
                  isSelected ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="relative z-10">{tf.label}</span>
                {isSelected && (
                  <motion.div
                    layoutId="mover-period-bg"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Movers Stock List */}
        <div className="mt-5 space-y-3 min-h-[260px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${direction}-${period}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="space-y-3"
            >
              {movers.map((item, idx) => (
                <MoverRow key={item.ticker} item={item} index={idx} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Explore Screener Action Button */}
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
  );
}

function MoverRow({ item, index }: { item: MoverItem; index: number }) {
  const isPositive = (item.change_pct ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: EASE }}
      whileHover={{ x: 4, transition: HOVER_SPRING }}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-colors duration-300 hover:border-cyan-400/30 hover:bg-white/10"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {item.ticker.slice(0, 2)}
        </div>
        <div>
          <div className="font-bold text-white text-sm">{item.ticker}</div>
          <div className="text-xs text-slate-400 max-w-[130px] truncate">{item.name}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-bold text-white">
          {item.price ? `₹${item.price.toLocaleString("en-IN")}` : "—"}
        </div>
        <div
          className={`inline-flex items-center gap-0.5 text-xs font-bold ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isPositive ? "+" : ""}
          {item.change_pct != null ? `${item.change_pct.toFixed(1)}%` : "0.0%"}
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart, type IChartApi, ColorType, CrosshairMode,
  CandlestickSeries, HistogramSeries, LineSeries,
} from "lightweight-charts";
import { Compass, Sparkles } from "lucide-react";
import MetricCard from "./shared/MetricCard";
import TradingSignal from "./shared/TradingSignal";
import AiAnalysisButton from "./shared/AiAnalysisButton";
import { motion, AnimatePresence } from "framer-motion";
import { getCompanyInfo } from "@/lib/companyData";
import { useMemo } from "react";
import type { CompanyAnalysisResponse } from "@/lib/types";

interface Props {
  ticker: string;
  companyName: string;
  analysisData?: CompanyAnalysisResponse | null;
}

function TimeframeDropdown({ selected, onSelect }: { selected: string; onSelect: (range: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const options = ["1M", "3M", "6M", "1Y", "2Y", "5Y", "Max"];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative z-30 inline-block text-left">
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c1324]/90 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-cyan-400/40 hover:text-white"
      >
        <span>{selected}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="text-cyan-400 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-chevron-down"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-28 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1324]/95 p-1.5 shadow-2xl backdrop-blur-2xl z-50"
          >
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                  selected === option
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{option}</span>
                {selected === option && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const INDICATORS = [
  { id: "volume", label: "Volume", on: true },
  { id: "ma50", label: "50-Day MA", on: true },
  { id: "ma200", label: "200-Day MA", on: false },
  { id: "macd", label: "MACD", on: true },
  { id: "bollinger", label: "Bollinger Bands", on: false },
  { id: "rsi", label: "RSI", on: true },
];

function generateOHLC(base: number, days = 252) {
  const data: any[] = [];
  const volumeData: any[] = [];
  const ma50: any[] = [];
  const ma200: any[] = [];
  let price = base * 0.85;
  const today = new Date();

  // Generate historical points including padding for 200 MA calculation
  const totalPoints = days + 200;

  for (let i = totalPoints; i >= 0; i--) {
    const dt = new Date(today); dt.setDate(dt.getDate() - i);
    const open = price;
    const change = (Math.random() - 0.48) * base * 0.025;
    const close = Math.max(open + change, base * 0.55);
    const high = Math.max(open, close) + Math.random() * base * 0.015;
    const low = Math.min(open, close) - Math.random() * base * 0.015;
    const vol = Math.round((8 + Math.random() * 12) * 1e6);
    const dateStr = dt.toISOString().split("T")[0];
    price = close;
    data.push({ time: dateStr, open, high, low, close });
    volumeData.push({ time: dateStr, value: vol, color: close >= open ? "rgba(38,166,91,0.5)" : "rgba(239,68,68,0.5)" });
  }

  for (let i = 0; i < data.length; i++) {
    if (i >= 49) {
      const avg = data.slice(i - 49, i + 1).reduce((s, d) => s + d.close, 0) / 50;
      ma50.push({ time: data[i].time, value: Math.round(avg * 100) / 100 });
    }
    if (i >= 199) {
      const avg = data.slice(i - 199, i + 1).reduce((s, d) => s + d.close, 0) / 200;
      ma200.push({ time: data[i].time, value: Math.round(avg * 100) / 100 });
    }
  }

  // Slice down to requested timeframe length
  const startIdx = Math.max(0, data.length - days);
  return {
    candleData: data.slice(startIdx),
    volumeData: volumeData.slice(startIdx),
    ma50: ma50.filter(m => data.slice(startIdx).some(d => d.time === m.time)),
    ma200: ma200.filter(m => data.slice(startIdx).some(d => d.time === m.time)),
  };
}

function generateMACD(candles: any[]) {
  const macdLine: any[] = [];
  const signalLine: any[] = [];
  const histogram: any[] = [];
  const ema12: number[] = [];
  const ema26: number[] = [];
  let ema12Prev = candles[0].close;
  let ema26Prev = candles[0].close;
  const k12 = 2 / 13, k26 = 2 / 27;
  for (let i = 0; i < candles.length; i++) {
    ema12Prev = candles[i].close * k12 + ema12Prev * (1 - k12);
    ema26Prev = candles[i].close * k26 + ema26Prev * (1 - k26);
    ema12.push(ema12Prev);
    ema26.push(ema26Prev);
  }
  let signalPrev = ema12[0] - ema26[0];
  const ks = 2 / 10;
  for (let i = 0; i < candles.length; i++) {
    const macd = ema12[i] - ema26[i];
    signalPrev = macd * ks + signalPrev * (1 - ks);
    const hist = macd - signalPrev;
    macdLine.push({ time: candles[i].time, value: Math.round(macd * 1000) / 1000 });
    signalLine.push({ time: candles[i].time, value: Math.round(signalPrev * 1000) / 1000 });
    histogram.push({ time: candles[i].time, value: Math.round(hist * 1000) / 1000, color: hist >= 0 ? "rgba(38,166,91,0.6)" : "rgba(239,68,68,0.6)" });
  }
  return { macdLine, signalLine, histogram };
}

function generateRSI(candles: any[]) {
  const rsiData: any[] = [];
  let avgGain = 0, avgLoss = 0;
  const period = 14;
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) avgGain += change; else avgLoss += Math.abs(change);
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiData.push({ time: candles[i].time, value: Math.round((100 - 100 / (1 + rs)) * 100) / 100 });
  }
  return rsiData;
}

function generateBollinger(candles: any[], period = 20, stdDevMult = 2) {
  const upper: any[] = [];
  const lower: any[] = [];
  const middle: any[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i >= period - 1) {
      const slice = candles.slice(i - period + 1, i + 1);
      const mean = slice.reduce((s, c) => s + c.close, 0) / period;
      const variance = slice.reduce((s, c) => s + Math.pow(c.close - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      middle.push({ time: candles[i].time, value: Math.round(mean * 100) / 100 });
      upper.push({ time: candles[i].time, value: Math.round((mean + stdDevMult * stdDev) * 100) / 100 });
      lower.push({ time: candles[i].time, value: Math.round((mean - stdDevMult * stdDev) * 100) / 100 });
    }
  }
  return { upper, lower, middle };
}

const tData: Record<string, any> = {
  RELIANCE: {
    signal: "HOLD", confidence: 54,
    explanation: ["Price above 50-Day MA", "Price below 200-Day MA", "Death cross forming", "RSI neutral at 52", "MACD bullish crossover"],
    keyLevels: { high52w: 3024.9, low52w: 2220.3, avgVolume: "12.4M", volatility: "28.5%" },
    oscillators: [
      { title: "RSI (14)", value: "52.7", subtitle: "Relative Strength Index", status: "NEUTRAL", statusColor: "text-blue-400 border-blue-500/30 bg-blue-500/10", barColor: "#3b82f6", progress: 52.7 },
      { title: "MACD", value: "1.82", subtitle: "Moving Average Convergence", status: "BULLISH", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", barColor: "#34d399" },
      { title: "Stochastic", value: "97.5", subtitle: "14-Day Oscillator", status: "OVERBOUGHT", statusColor: "text-red-400 border-red-500/30 bg-red-500/10", barColor: "#f87171", progress: 97.5 },
    ],
    trend: [
      { title: "SMA 50", value: "1,300.20", subtitle: "+2.7% vs Current Price", status: "UPTREND", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", progress: 70 },
      { title: "SMA 200", value: "1,402.36", subtitle: "-4.8% vs Current Price", status: "BEAR MARKET", statusColor: "text-amber-400 border-amber-500/30 bg-amber-500/10", progress: 30 },
      { title: "ATR (14)", value: "22.89", subtitle: "Translates to 1.7% daily move", status: "VOLATILITY", statusColor: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    ],
  },
  TCS: {
    signal: "BUY", confidence: 72,
    explanation: ["Price above 50-Day MA", "Price above 200-Day MA", "Golden cross confirmed", "RSI bullish at 62"],
    keyLevels: { high52w: 4250.0, low52w: 3200.0, avgVolume: "3.8M", volatility: "22.1%" },
    oscillators: [
      { title: "RSI (14)", value: "62.1", subtitle: "Relative Strength Index", status: "BULLISH", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", barColor: "#34d399", progress: 62.1 },
      { title: "MACD", value: "24.5", subtitle: "Moving Average Convergence", status: "BULLISH", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", barColor: "#34d399" },
      { title: "Stochastic", value: "71.5", subtitle: "14-Day Oscillator", status: "BULLISH", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", barColor: "#34d399", progress: 71.5 },
    ],
    trend: [
      { title: "SMA 50", value: "3,620", subtitle: "+5.2% vs Current Price", status: "UPTREND", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", progress: 75 },
      { title: "SMA 200", value: "3,480", subtitle: "+8.1% vs Current Price", status: "UPTREND", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", progress: 72 },
      { title: "ATR (14)", value: "58.2", subtitle: "Translates to 1.5% daily move", status: "VOLATILITY", statusColor: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    ],
  },
};

function DiagCard({ title, value, subtitle, status, statusColor, barColor, progress }: any) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c1324]/90 to-[#070b14]/90 p-5 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.12)] hover:-translate-y-0.5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-3xl" style={{ background: barColor || "#22d3ee" }} />
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">{title}</p>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${statusColor}`}>{status}</span>
      </div>
      <p className="text-3xl font-extrabold text-white tracking-tight font-mono">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%`, backgroundColor: barColor || "#34d399" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TechnicalAnalysisPage({ ticker, companyName }: Props) {
  const [active, setActive] = useState<Record<string, boolean>>(Object.fromEntries(INDICATORS.map(i => [i.id, i.on])));
  const [hoverData, setHoverData] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    ma50?: number;
    ma200?: number;
  } | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const macdRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);

  const companyInfo = useMemo(() => getCompanyInfo(ticker || "RELIANCE"), [ticker]);
  const basePrice = companyInfo.price;

  const d = useMemo(() => {
    if (tData[ticker?.toUpperCase()]) return tData[ticker.toUpperCase()];
    return {
      signal: companyInfo.recommendation.verdict.includes("Buy") ? "BUY" : "HOLD",
      confidence: companyInfo.recommendation.score,
      explanation: companyInfo.recommendation.summaryPoints,
      keyLevels: {
        high52w: Math.round(basePrice * 1.25 * 10) / 10,
        low52w: Math.round(basePrice * 0.75 * 10) / 10,
        avgVolume: "8.5M",
        volatility: "24.2%",
      },
      oscillators: [
        { title: "RSI (14)", value: "54.2", subtitle: "Relative Strength Index", status: "NEUTRAL", statusColor: "text-blue-400 border-blue-500/30 bg-blue-500/10", barColor: "#3b82f6", progress: 54.2 },
        { title: "MACD", value: "14.20", subtitle: "Moving Average Convergence", status: "BULLISH", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", barColor: "#34d399" },
        { title: "Stochastic", value: "64.8", subtitle: "14-Day Oscillator", status: "BULLISH", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", barColor: "#34d399", progress: 64.8 },
      ],
      trend: [
        { title: "SMA 50", value: `₹${(basePrice * 0.96).toFixed(0)}`, subtitle: "+4.2% vs Current Price", status: "UPTREND", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", progress: 75 },
        { title: "SMA 200", value: `₹${(basePrice * 0.91).toFixed(0)}`, subtitle: "+9.1% vs Current Price", status: "UPTREND", statusColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", progress: 72 },
        { title: "ATR (14)", value: `${(basePrice * 0.015).toFixed(1)}`, subtitle: "Translates to 1.5% daily move", status: "VOLATILITY", statusColor: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
      ],
    };
  }, [ticker, companyInfo, basePrice]);

  const [timeframe, setTimeframe] = useState("1Y");

  const timeframeDays = useMemo(() => {
    switch (timeframe) {
      case "1M": return 22;
      case "3M": return 65;
      case "6M": return 130;
      case "1Y": return 252;
      case "2Y": return 504;
      case "5Y": return 1260;
      case "Max": return 1260;
      default: return 252;
    }
  }, [timeframe]);

  const { candleData, volumeData, ma50, ma200 } = useMemo(() => {
    return generateOHLC(basePrice, timeframeDays);
  }, [basePrice, timeframeDays]);
  const { macdLine, signalLine, histogram } = useMemo(() => generateMACD(candleData), [candleData]);
  const rsiData = useMemo(() => generateRSI(candleData), [candleData]);
  const bollinger = useMemo(() => generateBollinger(candleData), [candleData]);

  const latestCandle = candleData[candleData.length - 1];

  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const checkTheme = () => setIsLightMode(document.documentElement.classList.contains("light"));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const chartBg = isLightMode ? "#ffffff" : "#070b14";
  const chartText = isLightMode ? "#334155" : "#64748b";
  const chartGrid = isLightMode ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.03)";
  const chartBorder = isLightMode ? "rgba(203,213,225,0.8)" : "rgba(255,255,255,0.06)";

  // Main candlestick chart with crosshair listener for floating info window
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartApiRef.current) { chartApiRef.current.remove(); chartApiRef.current = null; }

    const chart = createChart(chartRef.current, {
      layout: { background: { type: ColorType.Solid, color: chartBg }, textColor: chartText, fontSize: 11 },
      grid: { vertLines: { color: chartGrid }, horzLines: { color: chartGrid } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: chartBorder },
      timeScale: { borderColor: chartBorder, timeVisible: false },
      width: chartRef.current.clientWidth,
      height: 520,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a65b", downColor: "#ef5350", borderUpColor: "#26a65b", borderDownColor: "#ef5350",
      wickUpColor: "#26a65b", wickDownColor: "#ef5350",
    });
    candleSeries.setData(candleData);

    let volumeSeries: any = null;
    if (active.volume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        color: "#334155", priceFormat: { type: "volume" }, priceScaleId: "vol",
      });
      volumeSeries.setData(volumeData);
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    }

    let sma50Series: any = null;
    if (active.ma50) {
      sma50Series = chart.addSeries(LineSeries, { color: "#22d3ee", lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      sma50Series.setData(ma50);
    }

    let sma200Series: any = null;
    if (active.ma200) {
      sma200Series = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 2, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      sma200Series.setData(ma200);
    }

    if (active.bollinger) {
      const bbUpper = chart.addSeries(LineSeries, { color: "#ec4899", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      bbUpper.setData(bollinger.upper);
      const bbLower = chart.addSeries(LineSeries, { color: "#ec4899", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      bbLower.setData(bollinger.lower);
    }

    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || param.point === undefined || param.point.x < 0 || param.point.y < 0) {
        setHoverData(null);
        return;
      }
      const c = param.seriesData.get(candleSeries) as any;
      const v = volumeSeries ? (param.seriesData.get(volumeSeries) as any) : null;
      const s50 = sma50Series ? (param.seriesData.get(sma50Series) as any) : null;
      const s200 = sma200Series ? (param.seriesData.get(sma200Series) as any) : null;

      if (c) {
        let timeStr = "";
        if (typeof param.time === "string") {
          timeStr = param.time;
        } else if (typeof param.time === "number") {
          timeStr = new Date(param.time * 1000).toISOString().split("T")[0];
        } else if (param.time && typeof param.time === "object" && "year" in param.time) {
          const bt = param.time as any;
          timeStr = `${bt.year}-${String(bt.month).padStart(2, "0")}-${String(bt.day).padStart(2, "0")}`;
        }

        setHoverData({
          time: timeStr,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: v?.value,
          ma50: s50?.value,
          ma200: s200?.value,
        });
      }
    });

    chartApiRef.current = chart;
    chart.timeScale().fitContent();

    const onResize = () => {
      if (chartRef.current && chartApiRef.current) {
        chartApiRef.current.applyOptions({
          width: chartRef.current.clientWidth,
          height: 520,
        });
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartApiRef.current = null;
    };
  }, [ticker, candleData, volumeData, ma50, ma200, bollinger, active, isLightMode]);

  // MACD sub-chart
  useEffect(() => {
    if (!macdRef.current || !active.macd) return;
    const chart = createChart(macdRef.current, {
      layout: { background: { type: ColorType.Solid, color: chartBg }, textColor: chartText, fontSize: 10 },
      grid: { vertLines: { color: chartGrid }, horzLines: { color: chartGrid } },
      rightPriceScale: { borderColor: chartBorder },
      timeScale: { borderColor: chartBorder, visible: false },
      width: macdRef.current.clientWidth,
      height: 120,
    });
    const hist = chart.addSeries(HistogramSeries, { priceFormat: { type: "price", precision: 2, minMove: 0.01 } });
    hist.setData(histogram);
    const macdL = chart.addSeries(LineSeries, { color: "#3b82f6", lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    macdL.setData(macdLine);
    const sigL = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    sigL.setData(signalLine);
    chart.timeScale().fitContent();
    const onResize = () => { if (macdRef.current) chart.applyOptions({ width: macdRef.current.clientWidth }); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.remove(); };
  }, [histogram, macdLine, signalLine, active.macd, isLightMode]);

  // RSI sub-chart
  useEffect(() => {
    if (!rsiRef.current || !active.rsi) return;
    const chart = createChart(rsiRef.current, {
      layout: { background: { type: ColorType.Solid, color: chartBg }, textColor: chartText, fontSize: 10 },
      grid: { vertLines: { color: chartGrid }, horzLines: { color: chartGrid } },
      rightPriceScale: { borderColor: chartBorder },
      timeScale: { borderColor: chartBorder },
      width: rsiRef.current.clientWidth,
      height: 100,
    });
    const rsiL = chart.addSeries(LineSeries, { color: "#a78bfa", lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    rsiL.setData(rsiData);
    const ob = chart.addSeries(LineSeries, { color: "rgba(239,68,68,0.3)", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
    ob.setData(rsiData.map(d => ({ time: d.time, value: 70 })));
    const os = chart.addSeries(LineSeries, { color: "rgba(38,166,91,0.3)", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
    os.setData(rsiData.map(d => ({ time: d.time, value: 30 })));
    chart.timeScale().fitContent();
    const onResize = () => { if (rsiRef.current) chart.applyOptions({ width: rsiRef.current.clientWidth }); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.remove(); };
  }, [rsiData, active.rsi, isLightMode]);

  const activeClose = hoverData?.close ?? latestCandle?.close ?? basePrice;
  const activeOpen = hoverData?.open ?? latestCandle?.open ?? basePrice;
  const priceDiff = activeClose - activeOpen;
  const priceDiffPct = activeOpen ? (priceDiff / activeOpen) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {INDICATORS.map(ind => (
            <button key={ind.id} onClick={() => setActive(p => ({ ...p, [ind.id]: !p[ind.id] }))}
              className={`rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-all duration-300 ${
                active[ind.id]
                  ? "bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-300 border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-[1.04]"
                  : "bg-white/[0.04] text-slate-400 border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/15 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:scale-[1.02]"
              }`}>
              {ind.label}
            </button>
          ))}
        </div>
        <TimeframeDropdown selected={timeframe} onSelect={setTimeframe} />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1324]/90 to-[#070b14]/90 p-6 shadow-2xl backdrop-blur-2xl transition-colors hover:border-cyan-400/30">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{companyName}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Interactive Technical Chart · Canvas Engine</p>
          </div>

          {/* Dynamic Floating OHLC Info Window Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#070b14]/90 px-4 py-2 text-xs font-mono backdrop-blur-xl shadow-lg">
            <span className="font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg">
              📅 {hoverData?.time || latestCandle?.time || "Latest"}
            </span>
            <span className="text-slate-400">O: <strong className="text-white">₹{(hoverData?.open ?? latestCandle?.open ?? basePrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
            <span className="text-slate-400">H: <strong className="text-emerald-400">₹{(hoverData?.high ?? latestCandle?.high ?? basePrice * 1.02).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
            <span className="text-slate-400">L: <strong className="text-red-400">₹{(hoverData?.low ?? latestCandle?.low ?? basePrice * 0.98).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
            <span className="text-slate-400">C: <strong className="text-white">₹{activeClose.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
            <span className={`font-bold ${priceDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {priceDiff >= 0 ? "+" : ""}{priceDiff.toFixed(2)} ({priceDiffPct >= 0 ? "+" : ""}{priceDiffPct.toFixed(2)}%)
            </span>
            {hoverData?.ma50 && <span className="text-cyan-300 border-l border-white/10 pl-3">SMA50: ₹{hoverData.ma50.toFixed(1)}</span>}
          </div>
        </div>

        <div ref={chartRef} className="w-full h-[520px] rounded-xl overflow-hidden" />
        {active.macd && (
          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400/80 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> MACD Oscillator
            </div>
            <div ref={macdRef} className="w-full h-[120px] rounded-lg overflow-hidden" />
          </div>
        )}
        {active.rsi && (
          <div className="mt-3 border-t border-white/[0.06] pt-3">
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-400/80 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Relative Strength Index (RSI 14)
            </div>
            <div ref={rsiRef} className="w-full h-[100px] rounded-lg overflow-hidden" />
          </div>
        )}
      </div>

      <TradingSignal signal={d.signal} confidence={d.confidence} explanation={d.explanation} />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Key Levels</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="52W High" value={`₹${d.keyLevels.high52w.toLocaleString("en-IN")}`} />
          <MetricCard title="52W Low" value={`₹${d.keyLevels.low52w.toLocaleString("en-IN")}`} />
          <MetricCard title="Avg Volume" value={d.keyLevels.avgVolume} />
          <MetricCard title="Volatility (Ann.)" value={d.keyLevels.volatility} accent="warning" />
        </div>
      </div>

      <div>
        <div className="mb-6 flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <Compass className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Indicator Diagnostics</h3>
        </div>
        <p className="mb-4 text-sm font-medium text-slate-400">Momentum & Oscillators</p>
        <div className="mb-8 grid gap-4 lg:grid-cols-3">{d.oscillators.map((x: any) => <DiagCard key={x.title} {...x} />)}</div>
        <p className="mb-4 text-sm font-medium text-slate-400">Trend & Volatility</p>
        <div className="grid gap-4 lg:grid-cols-3">{d.trend.map((x: any) => <DiagCard key={x.title} {...x} />)}</div>
      </div>

      <AiAnalysisButton ticker={ticker} companyName={companyName} label="Get AI Chart Interpretation" />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart, type IChartApi, ColorType, CrosshairMode,
  CandlestickSeries, HistogramSeries, LineSeries,
} from "lightweight-charts";
import { Compass, Sparkles } from "lucide-react";
import MetricCard from "./shared/MetricCard";
import TradingSignal from "./shared/TradingSignal";
import { getCompanyInfo } from "@/lib/companyData";
import { useMemo } from "react";
import type { CompanyAnalysisResponse } from "@/lib/types";

interface Props {
  ticker: string;
  companyName: string;
  analysisData?: CompanyAnalysisResponse | null;
}

const INDICATORS = [
  { id: "volume", label: "Volume", on: true },
  { id: "ma50", label: "50-Day MA", on: true },
  { id: "ma200", label: "200-Day MA", on: false },
  { id: "macd", label: "MACD", on: true },
  { id: "bollinger", label: "Bollinger Bands", on: false },
  { id: "rsi", label: "RSI", on: true },
];

function generateOHLC(base: number) {
  const data: any[] = [];
  const volumeData: any[] = [];
  const ma50: any[] = [];
  const ma200: any[] = [];
  let price = base * 0.85;
  const today = new Date();

  for (let i = 300; i >= 0; i--) {
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
  return { candleData: data, volumeData, ma50, ma200 };
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
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0e1a] p-6 hover:border-white/[0.14]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-3xl" style={{ background: barColor }} />
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${statusColor}`}>{status}</span>
      </div>
      <p className="text-4xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      {progress !== undefined && (
        <div className="mt-5"><div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: barColor }} /></div></div>
      )}
    </div>
  );
}

export default function TechnicalAnalysisPage({ ticker, companyName }: Props) {
  const [active, setActive] = useState<Record<string, boolean>>(Object.fromEntries(INDICATORS.map(i => [i.id, i.on])));
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

  const { candleData, volumeData, ma50, ma200 } = useMemo(() => generateOHLC(basePrice), [basePrice]);
  const { macdLine, signalLine, histogram } = useMemo(() => generateMACD(candleData), [candleData]);
  const rsiData = useMemo(() => generateRSI(candleData), [candleData]);

  // Main candlestick chart
  useEffect(() => {
    if (!chartRef.current) return;
    if (chartApiRef.current) { chartApiRef.current.remove(); chartApiRef.current = null; }

    const chart = createChart(chartRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#0a0e1a" }, textColor: "#64748b", fontSize: 11 },
      grid: { vertLines: { color: "rgba(255,255,255,0.03)" }, horzLines: { color: "rgba(255,255,255,0.03)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: false },
      width: chartRef.current.clientWidth,
      height: 520,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a65b", downColor: "#ef5350", borderUpColor: "#26a65b", borderDownColor: "#ef5350",
      wickUpColor: "#26a65b", wickDownColor: "#ef5350",
    });
    candleSeries.setData(candleData);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#334155", priceFormat: { type: "volume" }, priceScaleId: "vol",
    });
    volumeSeries.setData(volumeData);
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    const sma50Series = chart.addSeries(LineSeries, { color: "#22d3ee", lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    sma50Series.setData(ma50);

    const sma200Series = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 2, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
    sma200Series.setData(ma200);

    chartApiRef.current = chart;
    chart.timeScale().fitContent();

    const onResize = () => {
      if (chartRef.current && chartApiRef.current) chartApiRef.current.applyOptions({ width: chartRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
      chartApiRef.current = null;
    };
  }, [ticker, candleData, volumeData, ma50, ma200]);

  // MACD sub-chart
  useEffect(() => {
    if (!macdRef.current) return;
    const chart = createChart(macdRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#0a0e1a" }, textColor: "#64748b", fontSize: 10 },
      grid: { vertLines: { color: "rgba(255,255,255,0.03)" }, horzLines: { color: "rgba(255,255,255,0.03)" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", visible: false },
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
  }, [histogram, macdLine, signalLine]);

  // RSI sub-chart
  useEffect(() => {
    if (!rsiRef.current) return;
    const chart = createChart(rsiRef.current, {
      layout: { background: { type: ColorType.Solid, color: "#0a0e1a" }, textColor: "#64748b", fontSize: 10 },
      grid: { vertLines: { color: "rgba(255,255,255,0.03)" }, horzLines: { color: "rgba(255,255,255,0.03)" } },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)" },
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
  }, [rsiData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {INDICATORS.map(ind => (
            <button key={ind.id} onClick={() => setActive(p => ({ ...p, [ind.id]: !p[ind.id] }))}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${active[ind.id] ? "bg-blue-500/15 text-blue-300 border border-blue-500/30" : "bg-white/[0.03] text-slate-400 border border-white/[0.08] hover:bg-white/[0.06]"}`}>
              {ind.label}
            </button>
          ))}
        </div>
        <select defaultValue="1Y" className="rounded-lg border border-white/[0.08] bg-[#0a0e1a] px-4 py-2 text-sm text-slate-300 outline-none">
          <option>1Y</option><option>6M</option><option>3M</option><option>1M</option>
        </select>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#0a0e1a] p-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <h3 className="text-base font-semibold text-white">{companyName}</h3>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "linear-gradient(135deg, #26a65b 50%, #ef5350 50%)" }} /> Price</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-cyan-400" /> SMA 50</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-blue-500" /> MACD</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-amber-400" /> Signal</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-violet-400" /> RSI</span>
          </div>
        </div>
        <div ref={chartRef} className="w-full" />
        <div className="mt-2 border-t border-white/[0.04] pt-2">
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">MACD</div>
          <div ref={macdRef} className="w-full" />
        </div>
        <div className="mt-2 border-t border-white/[0.04] pt-2">
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">RSI</div>
          <div ref={rsiRef} className="w-full" />
        </div>
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

      <button className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0a0e1a] px-6 py-4 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.14] hover:text-white">
        <Sparkles className="h-4 w-4 text-cyan-400" />
        Get AI Chart Interpretation
      </button>
    </div>
  );
}

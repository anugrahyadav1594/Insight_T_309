"use client";

/**
 * TechnicalAnalysisPage — Technical Analysis tab.
 * 
 * IMPORT PATHS for your project:
 *   import MetricCard from "./shared/MetricCard";
 *   import TradingSignal from "./shared/TradingSignal";
 *   import StatusBadge from "./shared/StatusBadge";
 *   import AiAnalysisButton from "./shared/AiAnalysisButton";
 */

import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import MetricCard from "./MetricCard";
import TradingSignal from "./TradingSignal";
import StatusBadge from "./StatusBadge";
import AiAnalysisButton from "./AiAnalysisButton";

interface TechnicalAnalysisPageProps { ticker: string; companyName: string }

const INDICATORS = [
  { id: "volume", label: "Volume", defaultOn: true },
  { id: "ma50", label: "50-Day MA", defaultOn: true },
  { id: "ma200", label: "200-Day MA", defaultOn: false },
  { id: "macd", label: "MACD", defaultOn: false },
  { id: "bollinger", label: "Bollinger Bands", defaultOn: false },
  { id: "rsi", label: "RSI", defaultOn: false },
];

function getPrices(basePrice: number) {
  const data: any[] = [];
  let price = basePrice * 0.85;
  const today = new Date();
  for (let i = 252; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    price = Math.max(price + (Math.random() - 0.48) * basePrice * 0.02, basePrice * 0.6);
    data.push({ date: d.toISOString().split("T")[0], price: Math.round(price * 100) / 100, volume: Math.round((8 + Math.random() * 12) * 1e6), ma50: undefined as number | undefined });
  }
  for (let i = 49; i < data.length; i++) {
    data[i].ma50 = Math.round(data.slice(i - 49, i + 1).reduce((s: number, d: any) => s + d.price, 0) / 50 * 100) / 100;
  }
  return data;
}

const technicalData: Record<string, any> = {
  RELIANCE: {
    signal: "HOLD", confidence: 54,
    explanation: ["Price above 50-Day MA", "Price below 200-Day MA", "Death cross forming", "RSI neutral at 52", "MACD bullish crossover"],
    keyLevels: { high52w: 3024.9, low52w: 2220.3, avgVolume: "12.4M", volatility: "28.5%" },
    oscillators: [
      { title: "RSI (14)", value: "52.3", status: "Neutral", description: "RSI is in the neutral zone.", progress: 52 },
      { title: "MACD", value: "8.45", status: "Bullish", description: "MACD line crossed above signal line." },
      { title: "Stochastic", value: "65.2", status: "Neutral", description: "Stochastic oscillator in the middle range.", progress: 65 },
    ],
    trend: [
      { title: "SMA 50", value: "₹2,845", status: "Uptrend", description: "Price is trading above the 50-day SMA." },
      { title: "SMA 200", value: "₹2,960", status: "Bear Market", description: "Price is below the 200-day SMA." },
      { title: "ATR (14)", value: "42.8", status: "Volatility", description: "Average true range indicates moderate volatility." },
    ],
  },
  TCS: {
    signal: "BUY", confidence: 72,
    explanation: ["Price above 50-Day MA", "Price above 200-Day MA", "Golden cross confirmed", "RSI bullish at 62"],
    keyLevels: { high52w: 4250.0, low52w: 3200.0, avgVolume: "3.8M", volatility: "22.1%" },
    oscillators: [
      { title: "RSI (14)", value: "62.1", status: "Bullish", description: "RSI trending upward.", progress: 62 },
      { title: "MACD", value: "24.5", status: "Bullish", description: "Strong bullish MACD divergence." },
      { title: "Stochastic", value: "71.5", status: "Bullish", description: "Strong momentum.", progress: 71 },
    ],
    trend: [
      { title: "SMA 50", value: "₹3,620", status: "Uptrend", description: "Price above 50-day SMA." },
      { title: "SMA 200", value: "₹3,480", status: "Uptrend", description: "Price above 200-day SMA." },
      { title: "ATR (14)", value: "58.2", status: "Volatility", description: "Moderate volatility.", progress: 45 },
    ],
  },
};

function DiagnosticCard({ title, value, status, description, progress }: any) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/[0.12]">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className={`h-full rounded-full transition-all duration-500 ${progress > 70 ? "bg-red-400" : progress > 30 ? "bg-cyan-400" : "bg-amber-400"}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-600">
            <span>Oversold</span><span>Overbought</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TechnicalAnalysisPage({ ticker, companyName }: TechnicalAnalysisPageProps) {
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(INDICATORS.map((i) => [i.id, i.defaultOn]))
  );
  const data = technicalData[ticker] || technicalData.RELIANCE;
  const prices = useMemo(() => getPrices(2920), []);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Indicators</h3>
        <div className="flex flex-wrap gap-2">
          {INDICATORS.map((ind) => (
            <button key={ind.id} onClick={() => setActive((p) => ({ ...p, [ind.id]: !p[ind.id] }))}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${active[ind.id] ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white"}`}>
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Technical Chart</h3>
            <p className="text-xs text-slate-500">1 Year · {ticker}</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-cyan-400" /> Price</span>
            {active.ma50 && <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-amber-400" /> MA 50</span>}
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={prices} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} interval={Math.floor(prices.length / 6)} />
              <YAxis yAxisId="price" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} domain={["dataMin - 50", "dataMax + 50"]} tickFormatter={(v) => `₹${v}`} />
              <YAxis yAxisId="volume" orientation="right" hide />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" }} />
              {active.volume && <Bar yAxisId="volume" dataKey="volume" fill="rgba(34,211,238,0.08)" barSize={2} />}
              <Line yAxisId="price" type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} dot={false} />
              {active.ma50 && <Line yAxisId="price" type="monotone" dataKey="ma50" stroke="#fbbf24" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Trading Signal</h3>
        <TradingSignal signal={data.signal} confidence={data.confidence} explanation={data.explanation} />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Key Levels</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="52W High" value={`₹${data.keyLevels.high52w.toLocaleString("en-IN")}`} />
          <MetricCard title="52W Low" value={`₹${data.keyLevels.low52w.toLocaleString("en-IN")}`} />
          <MetricCard title="Avg Volume" value={data.keyLevels.avgVolume} />
          <MetricCard title="Volatility (Ann.)" value={data.keyLevels.volatility} accent="warning" />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Momentum & Oscillators</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.oscillators.map((d: any) => <DiagnosticCard key={d.title} {...d} />)}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Trend & Volatility</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.trend.map((d: any) => <DiagnosticCard key={d.title} {...d} />)}
        </div>
      </div>

      <AiAnalysisButton label="Get AI Chart Interpretation" />
    </div>
  );
}

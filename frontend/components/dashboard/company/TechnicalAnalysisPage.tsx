"use client";

import { useState, useMemo } from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "./shared/MetricCard";
import TradingSignal from "./shared/TradingSignal";
import StatusBadge from "./shared/StatusBadge";
import AiAnalysisButton from "./shared/AiAnalysisButton";

interface Props { ticker: string; companyName: string }

const INDICATORS = [
  { id: "volume", label: "Volume", on: true },
  { id: "ma50", label: "50-Day MA", on: true },
  { id: "ma200", label: "200-Day MA", on: false },
  { id: "macd", label: "MACD", on: false },
  { id: "bollinger", label: "Bollinger Bands", on: false },
  { id: "rsi", label: "RSI", on: false },
];

function getPrices(base: number) {
  const d: any[] = [];
  let p = base * 0.85;
  const today = new Date();
  for (let i = 252; i >= 0; i--) {
    const dt = new Date(today); dt.setDate(dt.getDate() - i);
    p = Math.max(p + (Math.random() - 0.48) * base * 0.02, base * 0.6);
    d.push({ date: dt.toISOString().split("T")[0], price: Math.round(p * 100) / 100, volume: Math.round((8 + Math.random() * 12) * 1e6), ma50: undefined as number | undefined });
  }
  for (let i = 49; i < d.length; i++) d[i].ma50 = Math.round(d.slice(i - 49, i + 1).reduce((s: number, x: any) => s + x.price, 0) / 50 * 100) / 100;
  return d;
}

const tData: Record<string, any> = {
  RELIANCE: {
    signal: "HOLD", confidence: 54,
    explanation: ["Price above 50-Day MA", "Price below 200-Day MA", "Death cross forming", "RSI neutral at 52", "MACD bullish crossover"],
    keyLevels: { high52w: 3024.9, low52w: 2220.3, avgVolume: "12.4M", volatility: "28.5%" },
    oscillators: [
      { title: "RSI (14)", value: "52.3", status: "Neutral", description: "RSI in neutral zone.", progress: 52 },
      { title: "MACD", value: "8.45", status: "Bullish", description: "MACD crossed above signal." },
      { title: "Stochastic", value: "65.2", status: "Neutral", description: "Middle range.", progress: 65 },
    ],
    trend: [
      { title: "SMA 50", value: "₹2,845", status: "Uptrend", description: "Above 50-day SMA." },
      { title: "SMA 200", value: "₹2,960", status: "Bear Market", description: "Below 200-day SMA." },
      { title: "ATR (14)", value: "42.8", status: "Volatility", description: "Moderate volatility." },
    ],
  },
  TCS: {
    signal: "BUY", confidence: 72,
    explanation: ["Price above 50-Day MA", "Price above 200-Day MA", "Golden cross confirmed", "RSI bullish at 62"],
    keyLevels: { high52w: 4250.0, low52w: 3200.0, avgVolume: "3.8M", volatility: "22.1%" },
    oscillators: [
      { title: "RSI (14)", value: "62.1", status: "Bullish", description: "Trending up.", progress: 62 },
      { title: "MACD", value: "24.5", status: "Bullish", description: "Strong bullish." },
      { title: "Stochastic", value: "71.5", status: "Bullish", description: "Strong momentum.", progress: 71 },
    ],
    trend: [
      { title: "SMA 50", value: "₹3,620", status: "Uptrend", description: "Above 50-day." },
      { title: "SMA 200", value: "₹3,480", status: "Uptrend", description: "Above 200-day." },
      { title: "ATR (14)", value: "58.2", status: "Volatility", description: "Moderate.", progress: 45 },
    ],
  },
};

function DiagCard({ title, value, status, description, progress }: any) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className={`h-full rounded-full ${progress > 70 ? "bg-red-400" : progress > 30 ? "bg-cyan-400" : "bg-amber-400"}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-600"><span>Oversold</span><span>Overbought</span></div>
        </div>
      )}
    </div>
  );
}

export default function TechnicalAnalysisPage({ ticker }: Props) {
  const [active, setActive] = useState<Record<string, boolean>>(Object.fromEntries(INDICATORS.map(i => [i.id, i.on])));
  const d = tData[ticker] || tData.RELIANCE;
  const prices = useMemo(() => getPrices(2920), []);
  const tt = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" } as React.CSSProperties;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Indicators</h3>
        <div className="flex flex-wrap gap-2">
          {INDICATORS.map(ind => (
            <button key={ind.id} onClick={() => setActive(p => ({ ...p, [ind.id]: !p[ind.id] }))}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium ${active[ind.id] ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06]"}`}>
              {ind.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Technical Chart · 1Y</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={prices}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} interval={42} />
              <YAxis yAxisId="price" tick={{ fill: "#64748b", fontSize: 10 }} domain={["dataMin-50","dataMax+50"]} tickFormatter={v => `₹${v}`} />
              <YAxis yAxisId="vol" orientation="right" hide />
              <Tooltip contentStyle={tt} />
              {active.volume && <Bar yAxisId="vol" dataKey="volume" fill="rgba(34,211,238,0.08)" barSize={2} />}
              <Line yAxisId="price" type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} dot={false} />
              {active.ma50 && <Line yAxisId="price" type="monotone" dataKey="ma50" stroke="#fbbf24" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <TradingSignal signal={d.signal} confidence={d.confidence} explanation={d.explanation} />
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Key Levels</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="52W High" value={`₹${d.keyLevels.high52w.toLocaleString("en-IN")}`} />
          <MetricCard title="52W Low" value={`₹${d.keyLevels.low52w.toLocaleString("en-IN")}`} />
          <MetricCard title="Avg Volume" value={d.keyLevels.avgVolume} />
          <MetricCard title="Volatility" value={d.keyLevels.volatility} accent="warning" />
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Momentum & Oscillators</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.oscillators.map((x: any) => <DiagCard key={x.title} {...x} />)}</div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Trend & Volatility</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.trend.map((x: any) => <DiagCard key={x.title} {...x} />)}</div>
      </div>
      <AiAnalysisButton label="Get AI Chart Interpretation" />
    </div>
  );
}
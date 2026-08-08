"use client";

import { useState, useMemo } from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import MetricCard from "./shared/MetricCard";
import TradingSignal from "./shared/TradingSignal";
import StatusBadge from "./shared/StatusBadge";
import { getCompanyInfo } from "@/lib/companyData";
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
  { id: "macd", label: "MACD", on: false },
  { id: "bollinger", label: "Bollinger Bands", on: false },
  { id: "rsi", label: "RSI", on: false },
];

function getPrices(base: number) {
  const d: any[] = [];
  let closePrice = base * 0.85;
  const today = new Date();
  for (let i = 120; i >= 0; i--) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - i);
    const open = Math.max(closePrice + (Math.random() - 0.49) * base * 0.015, base * 0.5);
    const change = (Math.random() - 0.48) * base * 0.025;
    const close = Math.max(open + change, base * 0.5);
    const high = Math.max(open, close) + Math.random() * base * 0.012;
    const low = Math.min(open, close) - Math.random() * base * 0.012;

    d.push({
      date: dt.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      price: Math.round(close * 100) / 100,
      volume: Math.round((8 + Math.random() * 12) * 1e6),
      ma50: undefined as number | undefined,
    });
    closePrice = close;
  }
  for (let i = 49; i < d.length; i++) {
    d[i].ma50 = Math.round(d.slice(i - 49, i + 1).reduce((s: number, x: any) => s + x.close, 0) / 50 * 100) / 100;
  }
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

const CandlestickShape = (props: any) => {
  const { x, width, yAxis, payload } = props;
  if (!payload || !yAxis || typeof yAxis.scale !== "function") return null;

  const { open, high, low, close } = payload;
  if (open === undefined || high === undefined || low === undefined || close === undefined) return null;

  const isGreen = close >= open;
  const color = isGreen ? "#34d399" : "#f87171";
  const strokeColor = isGreen ? "#059669" : "#dc2626";

  const yHigh = yAxis.scale(high);
  const yLow = yAxis.scale(low);
  const yOpen = yAxis.scale(open);
  const yClose = yAxis.scale(close);

  const candleTop = Math.min(yOpen, yClose);
  const candleHeight = Math.max(Math.abs(yClose - yOpen), 2);
  const candleWidth = Math.max(width * 0.65, 3);
  const candleX = x + (width - candleWidth) / 2;
  const wickX = x + width / 2;

  return (
    <g className="candlestick-group">
      <line
        x1={wickX}
        y1={yHigh}
        x2={wickX}
        y2={yLow}
        stroke={color}
        strokeWidth={1.5}
      />
      <rect
        x={candleX}
        y={candleTop}
        width={candleWidth}
        height={candleHeight}
        fill={color}
        stroke={strokeColor}
        strokeWidth={1}
        rx={1}
      />
    </g>
  );
};

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  const formattedDate = new Date(data.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedVol =
    data.volume >= 1e7
      ? `${(data.volume / 1e7).toFixed(2)} Cr`
      : `${(data.volume / 1e5).toFixed(2)} L`;

  const isGreen = (data.close ?? data.price ?? 0) >= (data.open ?? 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1322]/95 p-4 text-xs shadow-2xl backdrop-blur-2xl space-y-2.5 min-w-[220px] z-50">
      <div className="border-b border-white/10 pb-2 flex items-center justify-between">
        <span className="font-bold text-slate-200">{formattedDate}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isGreen ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {isGreen ? "BULLISH 🟢" : "BEARISH 🔴"}
        </span>
      </div>

      <div className="space-y-1.5 font-mono text-xs">
        {data.open !== undefined && (
          <div className="grid grid-cols-2 gap-2 text-slate-300 border-b border-white/5 pb-2">
            <div><span className="text-slate-500">Open:</span> ₹{data.open.toFixed(2)}</div>
            <div><span className="text-slate-500">High:</span> ₹{data.high.toFixed(2)}</div>
            <div><span className="text-slate-500">Low:</span> ₹{data.low.toFixed(2)}</div>
            <div><span className="text-slate-500">Close:</span> ₹{data.close.toFixed(2)}</div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-1">
          <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-cyan-400" /> Price
          </span>
          <span className="font-bold text-white">₹{(data.close ?? data.price)?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        {data.ma50 !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> MA 50
            </span>
            <span className="font-semibold text-amber-300">₹{data.ma50?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        {data.volume !== undefined && (
          <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-1.5">
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-slate-500" /> Volume
            </span>
            <span className="font-semibold text-slate-300">{formattedVol}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  ticker: string;
  companyName: string;
  analysisData?: CompanyAnalysisResponse | null;
}

export default function TechnicalAnalysisPage({ ticker, companyName, analysisData }: Props) {
  const [active, setActive] = useState<Record<string, boolean>>(Object.fromEntries(INDICATORS.map(i => [i.id, i.on])));
  const [chartType, setChartType] = useState<"candlestick" | "line">("candlestick");

  const raw = analysisData?.raw_data;
  const techScores = (analysisData?.scores as any)?.technical;
  const companyInfo = useMemo(() => getCompanyInfo(ticker), [ticker]);

  const basePrice = raw?.price ? Number(raw.price) : (companyInfo.price || 2800);
  const prices = useMemo(() => getPrices(basePrice), [basePrice]);

  const signal = techScores?.signal || (companyInfo.recommendation.verdict.includes("Buy") ? "BUY" : "HOLD");
  const confidence = techScores?.confidence != null ? Math.round(Number(techScores.confidence) * 100) : companyInfo.recommendation.score;
  const explanation = techScores?.reasons || companyInfo.recommendation.summaryPoints;

  const high52w = raw?.high_52w ? Number(raw.high_52w) : Math.round(basePrice * 1.2 * 100) / 100;
  const low52w = raw?.low_52w ? Number(raw.low_52w) : Math.round(basePrice * 0.75 * 100) / 100;
  const avgVolume = raw?.avg_volume ? `${(Number(raw.avg_volume) / 1e6).toFixed(1)}M` : "8.5M";
  const volatility = raw?.volatility_30d ? `${(Number(raw.volatility_30d) * 100).toFixed(1)}%` : "24.2%";

  const oscillators = [
    { title: "RSI (14)", value: raw?.volatility_30d ? `${(Number(raw.volatility_30d) * 100).toFixed(1)}` : "54.2", status: "Neutral", description: "RSI in neutral momentum zone.", progress: 54 },
    { title: "MACD", value: "+14.20", status: "Bullish", description: "MACD line crossed above signal." },
    { title: "Stochastic", value: "64.8", status: "Neutral", description: "Mid-range oscillator signal.", progress: 65 },
  ];

  const trend = [
    { title: "SMA 50", value: `₹${(basePrice * 0.96).toFixed(0)}`, status: "Uptrend", description: "Price trading above 50-day SMA." },
    { title: "SMA 200", value: `₹${(basePrice * 0.91).toFixed(0)}`, status: "Bull Market", description: "Price trading above 200-day SMA." },
    { title: "ATR (14)", value: volatility, status: "Volatility", description: "Moderate daily price range." },
  ];

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
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-lg font-semibold text-white">Technical Chart · 1Y</h3>
          <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1">
            <button
              onClick={() => setChartType("candlestick")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                chartType === "candlestick"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🕯️ Candlestick
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                chartType === "line"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              📈 Line
            </button>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={prices}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} interval={24} />
              <YAxis yAxisId="price" tick={{ fill: "#64748b", fontSize: 10 }} domain={["auto", "auto"]} tickFormatter={v => `₹${v}`} />
              <YAxis yAxisId="vol" orientation="right" hide domain={[0, (max: number) => max * 4]} />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "rgba(34, 211, 238, 0.4)", strokeWidth: 1, strokeDasharray: "4 4" }}
                isAnimationActive={false}
              />
              {active.volume && <Bar yAxisId="vol" dataKey="volume" fill="rgba(51, 65, 85, 0.35)" barSize={4} radius={[2, 2, 0, 0]} />}
              {chartType === "candlestick" ? (
                <Bar
                  yAxisId="price"
                  dataKey="close"
                  shape={<CandlestickShape />}
                  isAnimationActive={false}
                />
              ) : (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {active.ma50 && <Line yAxisId="price" type="monotone" dataKey="ma50" stroke="#fbbf24" strokeWidth={1.5} dot={false} strokeDasharray="4 2" isAnimationActive={false} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <TradingSignal signal={signal} confidence={confidence} explanation={explanation} />
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Key Levels</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="52W High" value={`₹${high52w?.toLocaleString("en-IN")}`} />
          <MetricCard title="52W Low" value={`₹${low52w?.toLocaleString("en-IN")}`} />
          <MetricCard title="Avg Volume" value={avgVolume} />
          <MetricCard title="Volatility" value={volatility} accent="warning" />
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Momentum & Oscillators</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{oscillators.map((x: any) => <DiagCard key={x.title} {...x} />)}</div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Trend & Volatility</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{trend.map((x: any) => <DiagCard key={x.title} {...x} />)}</div>
      </div>
      <AiAnalysisButton label="Get AI Technical Analysis" />
    </div>
  );
}
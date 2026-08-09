import { useState, useMemo, useEffect } from "react";
import {
  ComposedChart, Line, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Newspaper, Sparkles, Building2, ExternalLink } from "lucide-react";
import { companyDataMap, getCompanyInfo } from "@/lib/companyData";
import type { CompanyAnalysisResponse } from "@/lib/types";
import AiAnalysisButton from "./shared/AiAnalysisButton";

interface Props {
  ticker: string;
  companyName: string;
  analysisData?: CompanyAnalysisResponse | null;
}

const TIME_RANGES = ["1D", "5D", "1M", "3M", "6M", "1Y", "2Y", "5Y", "Max"];

function getPrices(base: number) {
  const d: any[] = [];
  let p = base * 0.85;
  const today = new Date();
  for (let i = 252; i >= 0; i--) {
    const dt = new Date(today); dt.setDate(dt.getDate() - i);
    const prevP = p;
    p = Math.max(p + (Math.random() - 0.48) * base * 0.02, base * 0.6);
    const roundedP = Math.round(p * 100) / 100;
    const isUp = roundedP >= prevP;
    d.push({
      date: dt.toISOString().split("T")[0],
      price: roundedP,
      volume: Math.round((8 + Math.random() * 12) * 1e6),
      volColor: isUp ? "#10b981" : "#ef4444",
      ma20: undefined as number | undefined,
      ma50: undefined as number | undefined,
    });
  }
  for (let i = 0; i < d.length; i++) {
    if (i >= 19) d[i].ma20 = Math.round(d.slice(i - 19, i + 1).reduce((s: number, x: any) => s + x.price, 0) / 20 * 100) / 100;
    if (i >= 49) d[i].ma50 = Math.round(d.slice(i - 49, i + 1).reduce((s: number, x: any) => s + x.price, 0) / 50 * 100) / 100;
  }
  return d;
}

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

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1322]/95 p-4 text-xs shadow-2xl backdrop-blur-2xl space-y-2.5 min-w-[200px] z-50">
      <div className="border-b border-white/10 pb-2 flex items-center justify-between">
        <span className="font-bold text-slate-200">{formattedDate}</span>
        <span className="text-[10px] text-slate-500 font-mono">NSE</span>
      </div>

      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-blue-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Price
          </span>
          <span className="font-bold text-white">₹{data.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        {data.ma20 !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> MA 20
            </span>
            <span className="font-semibold text-cyan-300">₹{data.ma20?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}

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

export default function OverviewPage({ ticker, companyName, analysisData }: Props) {
  const [selectedRange, setSelectedRange] = useState("1Y");
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const checkTheme = () => setIsLightMode(document.documentElement.classList.contains("light"));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const companyInfo = useMemo(() => getCompanyInfo(ticker), [ticker]);
  const rawData = analysisData?.raw_data;

  const basePrice = rawData?.price ? Number(rawData.price) : (companyInfo?.price || 1334.80);
  const changePct = rawData?.day_change_pct ? Number(rawData.day_change_pct) : (companyInfo?.change || 0.74);
  const changeVal = rawData?.day_change ? Number(rawData.day_change) : (basePrice * changePct) / 100;
  const isPositive = changePct >= 0;

  const pricesFull = useMemo(() => getPrices(basePrice), [basePrice]);

  const prices = useMemo(() => {
    let days = 252;
    switch (selectedRange) {
      case "1D": days = 1; break;
      case "5D": days = 5; break;
      case "1M": days = 22; break;
      case "3M": days = 65; break;
      case "6M": days = 130; break;
      case "1Y": days = 252; break;
      case "2Y": days = 504; break;
      case "5Y": days = 1260; break;
      case "Max": days = pricesFull.length; break;
      default: days = 252; break;
    }
    return pricesFull.slice(Math.max(0, pricesFull.length - days));
  }, [pricesFull, selectedRange]);

  const tickFill = isLightMode ? "#475569" : "#94a3b8";
  const gridStroke = isLightMode ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.08)";
  const volumeFill = isLightMode ? "rgba(2,132,199,0.25)" : "rgba(34,211,238,0.25)";

  const newsData = [
    { time: "2h ago", source: "Market Pulse", headline: `${companyName} (${ticker}) shows solid momentum following Q3 performance updates.`, url: `https://www.google.com/search?q=${encodeURIComponent(companyName + " Q3 performance")}` },
    { time: "10h ago", source: "The Economic Times", headline: `${companyName} among top institutional holdings seeing increased allocation.`, url: `https://economictimes.indiatimes.com/` },
    { time: "1d ago", source: "Moneycontrol.com", headline: `Technical analysts highlight key support & breakout levels for ${ticker}.`, url: `https://www.moneycontrol.com/` },
    { time: "2d ago", source: "Mint", headline: `${companyName} executives outline strategic growth drivers at investor conference.`, url: `https://www.livemint.com/` },
  ];

  // Calculate real CAGR based on active timeframe selection & price data points
  const cagrMetrics = useMemo(() => {
    if (!prices || prices.length < 2) {
      return { cagr: "+7.26%", periodLabel: "Annualized over 5.0 Years", isPos: true };
    }
    const startPrice = prices[0].price;
    const endPrice = prices[prices.length - 1].price;

    let years = 1;
    switch (selectedRange) {
      case "1D": years = 1 / 252; break;
      case "5D": years = 5 / 252; break;
      case "1M": years = 1 / 12; break;
      case "3M": years = 0.25; break;
      case "6M": years = 0.5; break;
      case "1Y": years = 1.0; break;
      case "2Y": years = 2.0; break;
      case "5Y": years = 5.0; break;
      case "Max": years = 5.0; break;
      default: years = 1.0; break;
    }

    let cagrVal = 0;
    if (years >= 1.0) {
      cagrVal = (Math.pow(endPrice / startPrice, 1 / years) - 1) * 100;
    } else {
      cagrVal = ((endPrice - startPrice) / startPrice) * 100;
    }

    const isPos = cagrVal >= 0;
    const formattedCagr = `${isPos ? "+" : ""}${cagrVal.toFixed(2)}%`;
    const periodText = years < 1.0
      ? `Total return over ${selectedRange}`
      : `Annualized over ${years.toFixed(1)} Years (${selectedRange})`;

    return { cagr: formattedCagr, periodLabel: periodText, isPos };
  }, [prices, selectedRange]);

  return (
    <div className="space-y-8">
      {/* Subtitle */}
      <p className="text-sm text-slate-500">
        Showing overview for <span className="font-medium text-slate-300">{companyName}</span> · Data updates every 15 minutes
      </p>

      {/* Time Range Selector — radiant glowing buttons */}
      <div className="flex items-center gap-2 overflow-x-auto p-2 rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c1324]/90 to-[#070b14]/90 shadow-2xl backdrop-blur-2xl">
        {TIME_RANGES.map((range) => {
          const isSelected = selectedRange === range;
          return (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`flex-1 min-w-[50px] rounded-xl py-3 text-xs font-black font-mono tracking-wider transition-all duration-300 ${
                isSelected
                  ? "bg-gradient-to-r from-cyan-500/30 via-blue-600/30 to-cyan-500/30 text-cyan-300 border border-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,0.4)] scale-[1.04]"
                  : "bg-white/[0.04] text-slate-400 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:scale-[1.02]"
              }`}
            >
              {range}
            </button>
          );
        })}
      </div>

      {/* Price + CAGR Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Current Price */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0e1a] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {ticker} — NSE
          </p>
          <p className="mt-4 text-5xl font-bold text-white">
            ₹{basePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-4">
            <span
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium ${
                isPositive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}{changePct.toFixed(2)}% ({isPositive ? "+" : ""}₹{changeVal.toFixed(2)})
            </span>
          </div>
        </div>

        {/* CAGR */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0e1a] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Historical Stock CAGR ({selectedRange})
          </p>
          <p className="mt-4 text-5xl font-bold text-white font-mono">
            {cagrMetrics.cagr}
          </p>
          <div className="mt-4">
            <span
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium ${
                cagrMetrics.isPos
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {cagrMetrics.periodLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0a0e1a] p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{companyName}</h3>
          <div className="flex items-center gap-5 text-xs">
            <span className="flex items-center gap-2 text-slate-400">
              <span className={`h-0.5 w-5 rounded ${isPositive ? "bg-emerald-500" : "bg-red-500"}`} /> Price
            </span>
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-0.5 w-5 rounded bg-cyan-400" style={{ borderTop: "2px dashed #22d3ee" }} /> MA 20
            </span>
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-0.5 w-5 rounded bg-amber-400" style={{ borderTop: "2px dashed #fbbf24" }} /> MA 50
            </span>
          </div>
        </div>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={prices} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: tickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={prices.length <= 10 ? 0 : prices.length <= 30 ? 4 : prices.length <= 90 ? 12 : 42}
              />
              <YAxis
                yAxisId="price"
                tick={{ fill: tickFill, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `₹${v}`}
              />
              <YAxis yAxisId="vol" orientation="right" hide domain={[0, (max: number) => max * 4]} />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "rgba(34, 211, 238, 0.4)", strokeWidth: 1, strokeDasharray: "4 4" }}
                isAnimationActive={true}
                animationDuration={150}
                animationEasing="ease-out"
                {...({ followPointer: true } as any)}
              />
              <Bar yAxisId="vol" dataKey="volume" barSize={4} radius={[2, 2, 0, 0]}>
                {prices.map((entry, index) => (
                  <Cell key={`vol-cell-${index}`} fill={entry.volColor} opacity={0.5} />
                ))}
              </Bar>
              <Line yAxisId="price" type="monotone" dataKey="price" stroke={isPositive ? "#10b981" : "#ef4444"} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#22d3ee" strokeWidth={2} dot={false} strokeDasharray="6 3" isAnimationActive={false} />
              <Line yAxisId="price" type="monotone" dataKey="ma50" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="6 3" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent News */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <Newspaper className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Recent News</h3>
        </div>
        <div className="space-y-3">
          {newsData.map((item, i) => {
            const href = item.url || `https://www.google.com/search?q=${encodeURIComponent(item.headline)}`;
            return (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c1324]/90 to-[#070b14]/90 p-5 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.12)] hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400 font-medium">
                    {item.time} · <span className="text-cyan-400 font-mono font-semibold">{item.source}</span>
                  </p>
                  <ExternalLink className="h-4 w-4 shrink-0 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p className="mt-2 text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {item.headline}
                </p>
              </a>
            );
          })}
        </div>
      </div>

      <AiAnalysisButton ticker={ticker} companyName={companyName} label="Get AI Overview Analysis" />
    </div>
  );
}
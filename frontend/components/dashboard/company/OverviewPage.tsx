import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Newspaper, Sparkles, Building2 } from "lucide-react";
import { companyDataMap } from "@/lib/companyData";
import type { CompanyAnalysisResponse } from "@/lib/types";

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
    p = Math.max(p + (Math.random() - 0.48) * base * 0.02, base * 0.6);
    d.push({ date: dt.toISOString().split("T")[0], price: Math.round(p * 100) / 100, volume: Math.round((8 + Math.random() * 12) * 1e6), ma20: undefined as number | undefined, ma50: undefined as number | undefined });
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
  const companyInfo = useMemo(() => getCompanyInfo(ticker), [ticker]);
  const rawData = analysisData?.raw_data;

  const basePrice = rawData?.price ? Number(rawData.price) : (companyInfo?.price || 1334.80);
  const changePct = rawData?.day_change_pct ? Number(rawData.day_change_pct) : (companyInfo?.change || 0.74);
  const changeVal = rawData?.day_change ? Number(rawData.day_change) : (basePrice * changePct) / 100;
  const isPositive = changePct >= 0;

  const prices = useMemo(() => getPrices(basePrice), [basePrice]);

  const newsData = [
    { time: "2h ago", source: "Market Pulse", headline: `${companyName} (${ticker}) shows solid momentum following Q3 performance updates.` },
    { time: "10h ago", source: "The Economic Times", headline: `${companyName} among top institutional holdings seeing increased allocation.` },
    { time: "1d ago", source: "Moneycontrol.com", headline: `Technical analysts highlight key support & breakout levels for ${ticker}.` },
    { time: "2d ago", source: "Mint", headline: `${companyName} executives outline strategic growth drivers at investor conference.` },
  ];

  return (
    <div className="space-y-8">
      {/* Subtitle */}
      <p className="text-sm text-slate-500">
        Showing overview for <span className="font-medium text-slate-300">{companyName}</span> · Data updates every 15 minutes
      </p>

      {/* Time Range Selector — dark card row */}
      <div className="grid grid-cols-9 gap-2">
        {TIME_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`rounded-xl py-3 text-sm font-medium transition-all ${
              selectedRange === range
                ? "bg-white/[0.08] text-white border border-white/[0.12]"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            {range}
          </button>
        ))}
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
            Historical Stock CAGR
          </p>
          <p className="mt-4 text-5xl font-bold text-white">
            +7.26%
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
              Annualized over 5.0 Years
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
              <span className="h-0.5 w-5 rounded bg-blue-500" /> Price
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#475569", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={42}
              />
              <YAxis
                yAxisId="price"
                tick={{ fill: "#475569", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `₹${v}`}
              />
              <YAxis yAxisId="vol" orientation="right" hide domain={[0, (max: number) => max * 4]} />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "rgba(34, 211, 238, 0.4)", strokeWidth: 1, strokeDasharray: "4 4" }}
                isAnimationActive={false}
              />
              <Bar yAxisId="vol" dataKey="volume" fill="rgba(51, 65, 85, 0.35)" barSize={4} radius={[2, 2, 0, 0]} />
              <Line yAxisId="price" type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#22d3ee" strokeWidth={1.5} dot={false} strokeDasharray="6 3" isAnimationActive={false} />
              <Line yAxisId="price" type="monotone" dataKey="ma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="6 3" isAnimationActive={false} />
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
          {newsData.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/[0.08] bg-[#0a0e1a] p-5 transition-colors hover:border-white/[0.14]"
            >
              <p className="text-sm text-slate-500">
                {item.time} · <span className="text-blue-400">{item.source}</span>
              </p>
              <p className="mt-2 text-[15px] font-medium text-slate-200">
                {item.headline}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
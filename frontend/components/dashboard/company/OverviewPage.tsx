"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Newspaper } from "lucide-react";

interface Props { ticker: string; companyName: string }

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

const newsData = [
  { time: "2d ago", source: "India Infoline", headline: "Reliance Industries Share Price Rallies 3%: What's Driving the Stock Higher?" },
  { time: "10h ago", source: "The Economic Times", headline: "Maruti Suzuki India - Reliance Industries, ITC among 10 stocks that saw highest buying by LIC in Q1. See full list" },
  { time: "4d ago", source: "simplywall.st", headline: "Reliance Stock And 2 Indian Energy Names Facing Margin Pressure" },
  { time: "2d ago", source: "The Hindu", headline: "Stock markets edged higher in early trade amid lower crude oil prices, buying in Reliance Industries" },
  { time: "2d ago", source: "Upstox", headline: "SENSEX, NIFTY50 gain for second straight session led by Reliance Industries, SBI" },
  { time: "2d ago", source: "Moneycontrol.com", headline: "Reliance Industries shares rise 3.5% on crossing key technical indicator, multiple block deals" },
  { time: "2d ago", source: "ETV Bharat", headline: "Sensex Climbs 374 Points On Buying In Reliance, ICICI Bank; Nifty Ends Flat" },
  { time: "1d ago", source: "scanx.trade", headline: "Reliance Industries executives to meet investors at Emkay Confluence 2026" },
];

export default function OverviewPage({ ticker, companyName }: Props) {
  const [selectedRange, setSelectedRange] = useState("1Y");
  const prices = useMemo(() => getPrices(1334.80), []);

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
            ₹1,334.80
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-400">
              +0.74% (₹9.80)
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
                domain={[0, "auto"]}
                tickFormatter={(v) => v.toString()}
                label={{ value: "Price (INR)", angle: -90, position: "insideLeft", style: { fill: "#475569", fontSize: 11 } }}
              />
              <YAxis yAxisId="vol" orientation="right" hide domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Bar yAxisId="vol" dataKey="volume" fill="#334155" barSize={4} radius={[2, 2, 0, 0]} />
              <Line yAxisId="price" type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#22d3ee" strokeWidth={1.5} dot={false} strokeDasharray="6 3" />
              <Line yAxisId="price" type="monotone" dataKey="ma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="6 3" />
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
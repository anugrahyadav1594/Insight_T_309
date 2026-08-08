"use client";

/**
 * OverviewPage — Overview tab for the Company section.
 * 
 * IMPORT PATHS: When moving into your project, update these:
 *   import { getOverviewData, getHistoricalPrices } from "@/lib/companyMockData";
 *   import MetricCard from "./shared/MetricCard";
 *   import ScoreRing from "./shared/ScoreRing";
 *   import AiAnalysisButton from "./shared/AiAnalysisButton";
 */

import { useState, useMemo } from "react";
import {
  LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart,
} from "recharts";
import { Clock } from "lucide-react";
import MetricCard from "./MetricCard";
import ScoreRing from "./ScoreRing";
import AiAnalysisButton from "./AiAnalysisButton";

const TIME_RANGES = ["1D", "5D", "1M", "3M", "6M", "1Y", "2Y", "5Y", "Max"] as const;

// ── Inline mock data (move to lib/companyMockData.ts in your project) ────────

interface OverviewData {
  symbol: string; name: string; exchange: string; sector: string;
  price: number; dayChange: number; dayChangePct: number;
  cagr: number; cagrYears: number;
  keyMetrics: { peRatio: number; pbRatio: number; eps: number; marketCap: number; dividendYield: number; beta: number };
  scores: { technical: number; fundamental: number; riskSafety: number };
  news: { time: string; source: string; headline: string }[];
}

const overviews: Record<string, OverviewData> = {
  RELIANCE: {
    symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", sector: "Energy · Conglomerates",
    price: 2920.5, dayChange: 21.65, dayChangePct: 0.75, cagr: 7.26, cagrYears: 5.0,
    keyMetrics: { peRatio: 24.0, pbRatio: 2.34, eps: 121.69, marketCap: 1980000, dividendYield: 0.4, beta: 1.1 },
    scores: { technical: 47, fundamental: 47, riskSafety: 71 },
    news: [
      { time: "2d ago", source: "India Infoline", headline: "Reliance Industries Share Price Rallies 3%: What's Driving the Stock Higher?" },
      { time: "3d ago", source: "Moneycontrol", headline: "Reliance Jio adds 8 million subscribers in Q4, ARPU hits all-time high" },
      { time: "5d ago", source: "Economic Times", headline: "Reliance Retail eyes IPO in 2027, files draft papers with SEBI" },
    ],
  },
  TCS: {
    symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", sector: "Technology · IT Services",
    price: 3725.0, dayChange: 66.45, dayChangePct: 1.82, cagr: 12.4, cagrYears: 5.0,
    keyMetrics: { peRatio: 24.5, pbRatio: 10.2, eps: 152.04, marketCap: 1350000, dividendYield: 1.4, beta: 0.9 },
    scores: { technical: 72, fundamental: 85, riskSafety: 82 },
    news: [
      { time: "1d ago", source: "Moneycontrol", headline: "TCS Q4 results beat estimates, margins expand to 26%" },
      { time: "2d ago", source: "Mint", headline: "TCS bag $2B+ cloud transformation deal with European bank" },
    ],
  },
};

// Generate synthetic price data
function getPrices(basePrice: number): { date: string; price: number; volume: number; ma20?: number; ma50?: number }[] {
  const data: { date: string; price: number; volume: number; ma20?: number; ma50?: number }[] = [];
  let price = basePrice * 0.85;
  const today = new Date();
  for (let i = 252; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    price = Math.max(price + (Math.random() - 0.48) * basePrice * 0.02, basePrice * 0.6);
    data.push({ date: d.toISOString().split("T")[0], price: Math.round(price * 100) / 100, volume: Math.round((8 + Math.random() * 12) * 1e6) });
  }
  for (let i = 0; i < data.length; i++) {
    if (i >= 19) data[i].ma20 = Math.round(data.slice(i - 19, i + 1).reduce((s, d) => s + d.price, 0) / 20 * 100) / 100;
    if (i >= 49) data[i].ma50 = Math.round(data.slice(i - 49, i + 1).reduce((s, d) => s + d.price, 0) / 50 * 100) / 100;
  }
  return data;
}

function formatMarketCap(cr: number): string {
  if (cr >= 100000) return `₹${(cr / 100000).toFixed(2)}L Cr`;
  if (cr >= 1000) return `₹${(cr / 1000).toFixed(2)}K Cr`;
  return `₹${cr.toFixed(0)} Cr`;
}

interface OverviewPageProps { ticker: string; companyName: string }

export default function OverviewPage({ ticker, companyName }: OverviewPageProps) {
  const [selectedRange, setSelectedRange] = useState<string>("1Y");
  const overview = overviews[ticker] || overviews["RELIANCE"];
  const prices = useMemo(() => getPrices(overview.price), [overview.price]);
  const isPositive = overview.dayChange >= 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Clock className="h-3.5 w-3.5" />
        <span>Showing overview for {companyName} · Data updates every 15 minutes</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {TIME_RANGES.map((range) => (
          <button key={range} onClick={() => setSelectedRange(range)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${selectedRange === range ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white"}`}>
            {range}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{ticker} — {overview.exchange}</p>
          <p className="mt-2 text-4xl font-bold text-white">₹{overview.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          <p className={`mt-2 text-sm font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{overview.dayChangePct.toFixed(2)}% ({isPositive ? "+" : ""}₹{overview.dayChange.toFixed(2)})
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Historical Stock CAGR</p>
          <p className="mt-2 text-4xl font-bold text-emerald-400">+{overview.cagr.toFixed(2)}%</p>
          <p className="mt-2 text-sm text-slate-500">Annualized over {overview.cagrYears.toFixed(1)} Years</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Price History</h3>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-cyan-400" /> Price</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-amber-400" /> MA 20</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-violet-400" /> MA 50</span>
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
              <Bar yAxisId="volume" dataKey="volume" fill="rgba(34,211,238,0.08)" barSize={3} />
              <Line yAxisId="price" type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} dot={false} />
              <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#fbbf24" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line yAxisId="price" type="monotone" dataKey="ma50" stroke="#a78bfa" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Key Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard title="P/E Ratio" value={overview.keyMetrics.peRatio.toFixed(1)} />
          <MetricCard title="P/B Ratio" value={overview.keyMetrics.pbRatio.toFixed(2)} />
          <MetricCard title="EPS" value={`₹${overview.keyMetrics.eps.toFixed(2)}`} />
          <MetricCard title="Market Cap" value={formatMarketCap(overview.keyMetrics.marketCap)} />
          <MetricCard title="Dividend Yield" value={`${overview.keyMetrics.dividendYield.toFixed(2)}%`} />
          <MetricCard title="Beta" value={overview.keyMetrics.beta.toFixed(2)} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Analysis Scores</h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
            <ScoreRing score={overview.scores.technical} label="Technical" />
          </div>
          <div className="flex justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
            <ScoreRing score={overview.scores.fundamental} label="Fundamental" />
          </div>
          <div className="flex justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
            <ScoreRing score={overview.scores.riskSafety} label="Risk Safety" sublabel={overview.scores.riskSafety >= 70 ? "Good" : "Fair"} />
          </div>
        </div>
      </div>

      <AiAnalysisButton label="Get AI Company Summary" />

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Recent News</h3>
        <div className="space-y-3">
          {overview.news.map((item, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-xl transition-colors duration-300 hover:border-white/[0.12]">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{item.time}</span>
                <span className="h-1 w-1 rounded-full bg-slate-600" />
                <span className="text-slate-400">{item.source}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-200">{item.headline}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Percent, TrendingUp } from "lucide-react";

interface Props { ticker: string; companyName: string }

const chartData = {
  revenueNetProfit: [
    { year: "FY22", revenue: 792690, netProfit: 60680 },
    { year: "FY23", revenue: 888708, netProfit: 73672 },
    { year: "FY24", revenue: 915644, netProfit: 79120 },
    { year: "FY25", revenue: 1002300, netProfit: 84500 },
    { year: "FY26", revenue: 1089000, netProfit: 92100 },
  ],
  marginTrends: [
    { year: "FY22", grossMargin: 32.0, operatingMargin: 14.0, netMargin: 8.4 },
    { year: "FY23", grossMargin: 31.5, operatingMargin: 13.8, netMargin: 8.3 },
    { year: "FY24", grossMargin: 33.2, operatingMargin: 14.5, netMargin: 8.6 },
    { year: "FY25", grossMargin: 34.0, operatingMargin: 15.0, netMargin: 8.4 },
    { year: "FY26", grossMargin: 33.8, operatingMargin: 14.8, netMargin: 8.5 },
  ],
  radarAxes: [
    { subject: "ROE", value: 65, fullMark: 100 },
    { subject: "Gross Margin", value: 55, fullMark: 100 },
    { subject: "EBITDA", value: 60, fullMark: 100 },
    { subject: "Efficiency", value: 50, fullMark: 100 },
    { subject: "Low Debt", value: 70, fullMark: 100 },
    { subject: "Liquidity", value: 40, fullMark: 100 },
    { subject: "Net Margin", value: 45, fullMark: 100 },
  ],
};

type RatioStatus = "Good" | "Fair" | "Poor";

interface RatioItem {
  id: string;
  title: string;
  value: string;
  status: RatioStatus;
}

const profitability: RatioItem[] = [
  { id: "gm", title: "GROSS MARGIN", value: "25.58%", status: "Fair" },
  { id: "em", title: "EBITDA MARGIN", value: "19.38%", status: "Fair" },
  { id: "nm", title: "NET MARGIN", value: "7.64%", status: "Fair" },
  { id: "roe", title: "ROE", value: "8.93%", status: "Fair" },
];

const liquidity: RatioItem[] = [
  { id: "cr", title: "CURRENT RATIO", value: "1.10x", status: "Fair" },
  { id: "qr", title: "QUICK RATIO", value: "0.79x", status: "Fair" },
];

const leverage: RatioItem[] = [
  { id: "de", title: "DEBT/EQUITY", value: "0.44", status: "Good" },
  { id: "ic", title: "INTEREST COVER", value: "5.05x", status: "Good" },
];

const statusDot: Record<RatioStatus, string> = {
  Good: "bg-emerald-400",
  Fair: "bg-amber-400",
  Poor: "bg-red-400",
};

const statusBorder: Record<RatioStatus, string> = {
  Good: "border-emerald-500/30 text-emerald-400",
  Fair: "border-amber-500/30 text-amber-400",
  Poor: "border-red-500/30 text-red-400",
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-4">
      <Percent className="h-5 w-5 text-blue-400" />
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
  );
}

function RatioCard({ item }: { item: RatioItem }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0e1a] p-6 transition-colors hover:border-white/[0.14]">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{item.title}</p>
      <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
      <div className="mt-4">
        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium ${statusBorder[item.status]}`}>
          <span className={`h-2 w-2 rounded-full ${statusDot[item.status]}`} />
          {item.status}
        </span>
      </div>
    </div>
  );
}

function ViewTrendButton() {
  return (
    <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0a0e1a] py-2.5 text-sm text-slate-400 transition-colors hover:border-white/[0.14] hover:text-white">
      <TrendingUp className="h-3.5 w-3.5" />
      View Trend
    </button>
  );
}

export default function RatioAnalysisPage({ companyName }: Props) {
  const tt = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", fontSize: "12px" } as React.CSSProperties;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0e1a] p-6">
          <h3 className="mb-1 text-lg font-semibold text-white">Revenue & Net Profit</h3>
          <p className="mb-6 text-xs text-slate-500">Annual performance</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.revenueNetProfit} margin={{ top: 10, right: 10, bottom: 0, left: 0 }} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={tt} labelStyle={{ color: "#94a3b8" }} cursor={{ fill: "rgba(255,255,255,0.03)", radius: 4 }}
                  formatter={(value, name) => [`${Number(value).toLocaleString("en-IN")} Cr`, name === "revenue" ? "Revenue" : "Net Profit"]} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "16px" }}
                  formatter={(v) => v === "revenue" ? "Revenue" : "Net Profit"} iconType="square" />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="netProfit" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0e1a] p-6">
          <h3 className="mb-1 text-lg font-semibold text-white">Margin Trends</h3>
          <p className="mb-6 text-xs text-slate-500">Historical margin evolution (%)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.marginTrends} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tt} labelStyle={{ color: "#94a3b8" }} cursor={{ stroke: "rgba(255,255,255,0.15)", strokeDasharray: "4 4" }}
                  formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === "grossMargin" ? "Gross Margin" : name === "operatingMargin" ? "Operating Margin" : "Net Margin"]} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "16px" }}
                  formatter={(v) => v === "grossMargin" ? "Gross Margin" : v === "operatingMargin" ? "Operating Margin" : "Net Margin"} iconType="line" />
                <Line type="monotone" dataKey="grossMargin" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} activeDot={{ r: 5, stroke: "#34d399", strokeWidth: 2, fill: "#0a0e1a" }} />
                <Line type="monotone" dataKey="operatingMargin" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: "#22d3ee" }} activeDot={{ r: 5, stroke: "#22d3ee", strokeWidth: 2, fill: "#0a0e1a" }} />
                <Line type="monotone" dataKey="netMargin" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: "#fbbf24" }} activeDot={{ r: 5, stroke: "#fbbf24", strokeWidth: 2, fill: "#0a0e1a" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#0a0e1a] p-6">
        <h3 className="mb-1 text-lg font-semibold text-white">Financial Health Radar</h3>
        <p className="mb-6 text-xs text-slate-500">Multi-dimensional financial assessment</p>
        <div className="mx-auto h-80 max-w-md">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData.radarAxes}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: "#475569", fontSize: 9 }} domain={[0, 100]} axisLine={false} />
              <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionHeader title="Profitability" />
      <div className="grid gap-3 lg:grid-cols-4">
        {profitability.map((item) => (
          <div key={item.id}>
            <RatioCard item={item} />
            <ViewTrendButton />
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeader title="Liquidity" />
          <div className="grid gap-3 lg:grid-cols-2">
            {liquidity.map((item) => (
              <div key={item.id}>
                <RatioCard item={item} />
                <ViewTrendButton />
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionHeader title="Leverage" />
          <div className="grid gap-3 lg:grid-cols-2">
            {leverage.map((item) => (
              <div key={item.id}>
                <RatioCard item={item} />
                <ViewTrendButton />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0a0e1a] px-6 py-4 text-sm font-medium text-slate-300 transition-all hover:border-white/[0.14] hover:text-white">
        Get AI Ratio Analysis
      </button>
    </div>
  );
}
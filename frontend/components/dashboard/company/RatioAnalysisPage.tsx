"use client";

import {
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import StatusBadge from "./shared/StatusBadge";
import AiAnalysisButton from "./shared/AiAnalysisButton";

interface Props { ticker: string; companyName: string }

const data = {
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
  profitability: [
    { id: "gm", title: "Gross Margin", value: "33.8%", status: "Fair" },
    { id: "em", title: "EBITDA Margin", value: "22.4%", status: "Fair" },
    { id: "nm", title: "Net Margin", value: "8.5%", status: "Fair" },
    { id: "roe", title: "ROE", value: "9.8%", status: "Fair" },
  ],
  liquidity: [
    { id: "cr", title: "Current Ratio", value: "1.10x", status: "Fair" },
    { id: "qr", title: "Quick Ratio", value: "0.82x", status: "Poor" },
  ],
  leverage: [
    { id: "de", title: "Debt/Equity", value: "0.60x", status: "Good" },
    { id: "ic", title: "Interest Cover", value: "8.2x", status: "Good" },
  ],
};

type Ratio = { id: string; title: string; value: string; status: string };

function RatioGroup({ title, ratios }: { title: string; ratios: Ratio[] }) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ratios.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{r.title}</p>
            <p className="mt-2 text-2xl font-bold text-white">{r.value}</p>
            <div className="mt-3 flex items-center justify-between">
              <StatusBadge status={r.status} />
              <button className="text-xs text-slate-500 hover:text-cyan-400">View Trend</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RatioAnalysisPage({ ticker, companyName }: Props) {
  const tt = { background: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" } as React.CSSProperties;
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
        <h3 className="mb-1 text-lg font-semibold text-white">Revenue & Net Profit</h3>
        <p className="mb-4 text-xs text-slate-500">Annual performance (₹ Crores)</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenueNetProfit}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tt} />
              <Legend formatter={(v) => v === "revenue" ? "Revenue" : "Net Profit"} />
              <Bar dataKey="revenue" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="netProfit" fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
        <h3 className="mb-1 text-lg font-semibold text-white">Margin Trends</h3>
        <p className="mb-4 text-xs text-slate-500">Historical margin evolution (%)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.marginTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tt} />
              <Legend formatter={(v) => v === "grossMargin" ? "Gross Margin" : v === "operatingMargin" ? "Operating Margin" : "Net Margin"} />
              <Line type="monotone" dataKey="grossMargin" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="operatingMargin" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="netMargin" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-xl">
        <h3 className="mb-1 text-lg font-semibold text-white">Financial Health Radar</h3>
        <div className="mx-auto h-80 max-w-md">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.radarAxes}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: "#475569", fontSize: 9 }} domain={[0, 100]} axisLine={false} />
              <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <RatioGroup title="Profitability" ratios={data.profitability} />
      <RatioGroup title="Liquidity" ratios={data.liquidity} />
      <RatioGroup title="Leverage" ratios={data.leverage} />
      <AiAnalysisButton label="Get AI Ratio Analysis" />
    </div>
  );
}
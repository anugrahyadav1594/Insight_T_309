"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Percent, TrendingUp } from "lucide-react";
import { getCompanyInfo } from "@/lib/companyData";
import AiAnalysisButton from "./shared/AiAnalysisButton";

import type { CompanyAnalysisResponse } from "@/lib/types";

interface Props {
  ticker: string;
  companyName: string;
  analysisData?: CompanyAnalysisResponse | null;
}

type RatioStatus = "Good" | "Fair" | "Poor";

interface RatioItem {
  id: string;
  title: string;
  value: string;
  status: RatioStatus;
}

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

const CustomFloatingTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1322]/95 p-4 text-xs shadow-2xl backdrop-blur-2xl space-y-2.5 min-w-[200px] z-50">
      <div className="border-b border-white/10 pb-2 flex items-center justify-between">
        <span className="font-bold text-slate-200">{label || data.year || data.subject}</span>
        <span className="text-[10px] text-slate-500 font-mono">NSE</span>
      </div>

      <div className="space-y-1.5 font-mono text-xs">
        {payload.map((item: any, idx: number) => {
          const rawName = item.name || item.dataKey;
          const displayName =
            rawName === "revenue" ? "Revenue" :
            rawName === "netProfit" ? "Net Profit" :
            rawName === "grossMargin" ? "Gross Margin" :
            rawName === "operatingMargin" ? "Operating Margin" :
            rawName === "netMargin" ? "Net Margin" :
            rawName === "value" ? "Score" : rawName;

          const color =
            rawName === "revenue" ? "#3b82f6" :
            rawName === "netProfit" ? "#a855f7" :
            item.color || item.fill || "#22d3ee";

          const formattedVal = typeof item.value === "number"
            ? (unit === "Cr" || rawName === "revenue" || rawName === "netProfit"
                ? `₹${item.value.toLocaleString("en-IN")} Cr`
                : unit === "Score" || rawName === "value"
                ? `${item.value}/100`
                : `${item.value.toFixed(1)}%`)
            : item.value;

          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 font-medium" style={{ color }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {displayName}
              </span>
              <span className="font-bold text-white">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function RatioAnalysisPage({ ticker, companyName }: Props) {
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const checkTheme = () => setIsLightMode(document.documentElement.classList.contains("light"));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const companyInfo = useMemo(() => getCompanyInfo(ticker || "RELIANCE"), [ticker]);

  const roeVal = parseFloat(companyInfo.financials?.roe || "18");
  const revGrowthVal = parseFloat(companyInfo.financials?.revenueGrowth || "15");
  const deVal = parseFloat(companyInfo.financials?.debtEquity || "0.2");
  const basePrice = companyInfo.price;
  const baseRev = Math.round(basePrice * 120);

  const chartData = useMemo(() => ({
    revenueNetProfit: [
      { year: "FY21", revenue: Math.round(baseRev * 0.72), netProfit: Math.round(baseRev * 0.11) },
      { year: "FY22", revenue: Math.round(baseRev * 0.81), netProfit: Math.round(baseRev * 0.13) },
      { year: "FY23", revenue: Math.round(baseRev * 0.90), netProfit: Math.round(baseRev * 0.15) },
      { year: "FY24", revenue: Math.round(baseRev * 0.96), netProfit: Math.round(baseRev * 0.16) },
      { year: "FY25", revenue: baseRev, netProfit: Math.round(baseRev * (roeVal / 100)) },
    ],
    marginTrends: [
      { year: "FY21", grossMargin: 42.1, operatingMargin: 21.4, netMargin: 15.2 },
      { year: "FY22", grossMargin: 44.5, operatingMargin: 23.1, netMargin: 16.8 },
      { year: "FY23", grossMargin: 46.8, operatingMargin: 25.0, netMargin: 18.1 },
      { year: "FY24", grossMargin: 48.2, operatingMargin: 26.4, netMargin: 19.5 },
      { year: "FY25", grossMargin: 50.1, operatingMargin: 28.2, netMargin: Math.max(12, Math.min(25, roeVal)) },
    ],
    radarAxes: [
      { subject: "Profitability", value: Math.min(95, Math.max(50, Math.round(roeVal * 4))) },
      { subject: "Growth", value: Math.min(95, Math.max(45, Math.round(revGrowthVal * 4.5))) },
      { subject: "Liquidity", value: 85 },
      { subject: "Solvency", value: deVal < 0.5 ? 90 : 65 },
      { subject: "Efficiency", value: 88 },
      { subject: "Valuation", value: 72 },
    ],
  }), [baseRev, roeVal, revGrowthVal, deVal]);

  const profitability: RatioItem[] = [
    { id: "roe", title: "ROE", value: `${roeVal}%`, status: roeVal > 15 ? "Good" : "Fair" },
    { id: "roce", title: "ROCE", value: `${(roeVal * 1.15).toFixed(1)}%`, status: roeVal > 12 ? "Good" : "Fair" },
    { id: "opm", title: "OPERATING MARGIN", value: "28.2%", status: "Good" },
    { id: "npm", title: "NET MARGIN", value: `${Math.max(12, Math.min(25, roeVal)).toFixed(1)}%`, status: "Good" },
  ];

  const liquidity: RatioItem[] = [
    { id: "cr", title: "CURRENT RATIO", value: "2.10", status: "Good" },
    { id: "qr", title: "QUICK RATIO", value: "1.65", status: "Good" },
  ];

  const leverage: RatioItem[] = [
    { id: "de", title: "DEBT/EQUITY", value: `${deVal}`, status: deVal < 0.5 ? "Good" : "Fair" },
    { id: "ic", title: "INTEREST COVER", value: "8.50x", status: "Good" },
  ];

  const dotFill = isLightMode ? "#ffffff" : "#0a0e1a";
  const tickFill = isLightMode ? "#475569" : "#94a3b8";
  const gridStroke = isLightMode ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.08)";

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0e1a] p-6">
          <h3 className="mb-1 text-lg font-semibold text-white">Revenue & Net Profit</h3>
          <p className="mb-6 text-xs text-slate-500">Annual performance for {companyName || companyInfo.name} (₹ Crores)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.revenueNetProfit} margin={{ top: 10, right: 10, bottom: 0, left: 0 }} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: tickFill, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomFloatingTooltip unit="Cr" />} cursor={{ fill: "rgba(255,255,255,0.04)", radius: 6 }} isAnimationActive={true} animationDuration={150} animationEasing="ease-out" {...({ followPointer: true } as any)} />
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
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: tickFill, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: tickFill, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomFloatingTooltip unit="%" />} cursor={{ stroke: "rgba(34,211,238,0.3)", strokeDasharray: "4 4" }} isAnimationActive={true} animationDuration={150} animationEasing="ease-out" {...({ followPointer: true } as any)} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "16px" }}
                  formatter={(v) => v === "grossMargin" ? "Gross Margin" : v === "operatingMargin" ? "Operating Margin" : "Net Margin"} iconType="line" />
                <Line type="monotone" dataKey="grossMargin" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399" }} activeDot={{ r: 5, stroke: "#34d399", strokeWidth: 2, fill: dotFill }} />
                <Line type="monotone" dataKey="operatingMargin" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: "#22d3ee" }} activeDot={{ r: 5, stroke: "#22d3ee", strokeWidth: 2, fill: dotFill }} />
                <Line type="monotone" dataKey="netMargin" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: "#fbbf24" }} activeDot={{ r: 5, stroke: "#fbbf24", strokeWidth: 2, fill: dotFill }} />
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
              <Tooltip content={<CustomFloatingTooltip unit="Score" />} isAnimationActive={true} animationDuration={150} animationEasing="ease-out" {...({ followPointer: true } as any)} />
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

      <AiAnalysisButton ticker={ticker} companyName={companyName} label="Get AI Ratio Analysis" />
    </div>
  );
}
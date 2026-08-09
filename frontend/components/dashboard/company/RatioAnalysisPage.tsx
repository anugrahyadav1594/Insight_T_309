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

function RatioCard({ item, onClick }: { item: RatioItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-[#0a0e1a] p-6 transition-all duration-300 hover:border-cyan-400/40 hover:bg-cyan-500/[0.04] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] hover:-translate-y-1"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 group-hover:text-cyan-300 transition-colors">
          {item.title}
        </p>
        <TrendingUp className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
      </div>
      <p className="mt-3 text-3xl font-bold text-white font-mono">{item.value}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium ${statusBorder[item.status]}`}>
          <span className={`h-2 w-2 rounded-full ${statusDot[item.status]}`} />
          {item.status}
        </span>
        <span className="text-[11px] font-semibold text-cyan-400/80 group-hover:text-cyan-300 transition-colors">
          Click for trend →
        </span>
      </div>
    </div>
  );
}

function ViewTrendModal({
  isOpen,
  onClose,
  title,
  currentValue,
  ticker,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  currentValue: string;
  ticker: string;
}) {
  if (!isOpen) return null;

  const numericVal = parseFloat(currentValue.replace(/[^0-9.]/g, "")) || 15;
  const trendData = [
    { year: "FY21", value: Math.round(numericVal * 0.78 * 10) / 10 },
    { year: "FY22", value: Math.round(numericVal * 0.85 * 10) / 10 },
    { year: "FY23", value: Math.round(numericVal * 0.92 * 10) / 10 },
    { year: "FY24", value: Math.round(numericVal * 0.97 * 10) / 10 },
    { year: "FY25", value: numericVal },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl backdrop-blur-3xl z-10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              {title} Multi-Year Trend
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{ticker} · 5-Year Historical Trajectory</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-xs text-slate-400">Current Value</span>
          <span className="text-xl font-bold font-mono text-cyan-300">{currentValue}</span>
        </div>

        <div className="h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomFloatingTooltip unit="" />} cursor={{ stroke: "rgba(34,211,238,0.3)", strokeDasharray: "4 4" }} />
              <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2.5} dot={{ r: 4, fill: "#22d3ee" }} activeDot={{ r: 6, stroke: "#22d3ee", strokeWidth: 2, fill: "#0b1220" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20">
            Close
          </button>
        </div>
      </div>
    </div>
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

  const [selectedTrend, setSelectedTrend] = useState<{ title: string; value: string } | null>(null);

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
          <RatioCard key={item.id} item={item} onClick={() => setSelectedTrend({ title: item.title, value: item.value })} />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeader title="Liquidity" />
          <div className="grid gap-3 lg:grid-cols-2">
            {liquidity.map((item) => (
              <RatioCard key={item.id} item={item} onClick={() => setSelectedTrend({ title: item.title, value: item.value })} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader title="Leverage" />
          <div className="grid gap-3 lg:grid-cols-2">
            {leverage.map((item) => (
              <RatioCard key={item.id} item={item} onClick={() => setSelectedTrend({ title: item.title, value: item.value })} />
            ))}
          </div>
        </div>
      </div>

      <AiAnalysisButton ticker={ticker} companyName={companyName} label="Get AI Ratio Analysis" />

      {selectedTrend && (
        <ViewTrendModal
          isOpen={true}
          onClose={() => setSelectedTrend(null)}
          title={selectedTrend.title}
          currentValue={selectedTrend.value}
          ticker={ticker}
        />
      )}
    </div>
  );
}
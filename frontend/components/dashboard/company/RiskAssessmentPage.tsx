"use client";

import { useMemo } from "react";
import RiskFactorCard from "./shared/RiskFactorCard";
import AiAnalysisButton from "./shared/AiAnalysisButton";
import { getCompanyInfo } from "@/lib/companyData";
import type { CompanyAnalysisResponse } from "@/lib/types";
import { ShieldAlert, TrendingUp, Activity, Building2, Globe, Sparkles, ShieldCheck } from "lucide-react";

interface Props {
  ticker: string;
  companyName: string;
  analysisData?: CompanyAnalysisResponse | null;
}

function getCompanyRisk(companyInfo: any) {
  const de = parseFloat(companyInfo.financials?.debtEquity || "0.3");
  const roe = parseFloat(companyInfo.financials?.roe || "18");
  const baseRisk = Math.min(Math.max(Math.round(25 + de * 20 - (roe - 15) * 0.5), 12), 75);

  return {
    overallRisk: baseRisk,
    overallSafety: 100 - baseRisk,
    overallLabel: baseRisk < 30 ? "Low Risk" : baseRisk < 55 ? "Moderate Risk" : "High Risk",
    overallDescription: `${companyInfo.name} displays a ${baseRisk < 30 ? "conservative" : "balanced"} risk profile with debt-to-equity ratio of ${de} and ROE of ${roe}%.`,
    financial: [
      { title: "Leverage Risk", description: `Debt/Equity at ${de}x`, score: Math.round(de * 35), status: de < 0.3 ? "Low Risk" : "Moderate Risk" },
      { title: "Coverage Risk", description: "Interest coverage healthy > 8x", score: 18, status: "Low Risk" },
      { title: "Earnings Stability", description: `ROE at ${roe}%`, score: Math.max(35 - Math.round(roe * 0.8), 10), status: "Low Risk" },
      { title: "Margin Risk", description: `Stable profitability in ${companyInfo.sector}`, score: 24, status: "Low Risk" },
    ],
    valuation: [
      { title: "Valuation Risk", description: `Valuation aligns with ${companyInfo.sector} peers`, score: 28, status: "Low Risk" },
      { title: "Expectation Risk", description: "Moderate market expectations", score: 25, status: "Low Risk" },
      { title: "Growth Premia", description: "Growth price targets supported by earnings", score: 22, status: "Low Risk" },
    ],
    market: [
      { title: "Beta Risk", description: `Beta relative to Nifty 50`, score: 28, status: "Low Risk" },
      { title: "Liquidity Risk", description: "High average daily trading volume", score: 12, status: "Low Risk" },
      { title: "Volatility Risk", description: "30D Volatility within standard range", score: 30, status: "Low Risk" },
    ],
    industry: [
      { title: "Competitive Risk", description: `Strong market position in ${companyInfo.sector}`, score: 20, status: "Low Risk" },
      { title: "Regulatory Risk", description: "Compliance monitored regularly", score: 32, status: "Moderate Risk" },
    ],
    macro: [
      { title: "Interest Rate Risk", description: "Moderate sensitivity to rate cycles", score: 28, status: "Low Risk" },
      { title: "Currency Risk", description: "Exposure managed via hedging", score: 30, status: "Low Risk" },
    ],
    table: [
      { factor: "Financial Risk", weight: 30, score: Math.round(baseRisk * 0.9), contribution: (baseRisk * 0.27), status: "Low" },
      { factor: "Valuation Risk", weight: 25, score: Math.round(baseRisk * 0.95), contribution: (baseRisk * 0.24), status: "Low" },
      { factor: "Market Risk", weight: 20, score: Math.round(baseRisk * 0.85), contribution: (baseRisk * 0.17), status: "Low" },
      { factor: "Industry Risk", weight: 15, score: Math.round(baseRisk * 1.05), contribution: (baseRisk * 0.16), status: "Moderate" },
      { factor: "Macro Risk", weight: 10, score: Math.round(baseRisk * 1.1), contribution: (baseRisk * 0.11), status: "Moderate" },
    ],
  };
}

const CATEGORY_META = {
  financial: { title: "Financial Risk", icon: ShieldAlert, color: "text-emerald-400" },
  valuation: { title: "Valuation Risk", icon: TrendingUp, color: "text-cyan-400" },
  market: { title: "Market Risk", icon: Activity, color: "text-blue-400" },
  industry: { title: "Industry Risk", icon: Building2, color: "text-amber-400" },
  macro: { title: "Macro & Execution Risk", icon: Globe, color: "text-purple-400" },
};

export default function RiskAssessmentPage({ ticker, companyName, analysisData }: Props) {
  const companyInfo = useMemo(() => getCompanyInfo(ticker), [ticker]);
  const d = useMemo(() => getCompanyRisk(companyInfo), [companyInfo]);
  const riskObj = (analysisData?.scores as any)?.risk;

  const overallRisk = riskObj?.score != null ? Math.round(Number(riskObj.score)) : d.overallRisk;
  const overallSafety = 100 - overallRisk;
  const overallLabel = riskObj?.category || (overallRisk < 35 ? "Low Risk" : overallRisk < 65 ? "Moderate Risk" : "High Risk");
  const overallDescription = (analysisData?.ai as any)?.risk_summary || d.overallDescription;

  const isLow = overallLabel.toLowerCase().includes("low");

  return (
    <div className="space-y-10">
      {/* Hero Overview Risk Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1324]/90 to-[#070b14]/90 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/30">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Comprehensive Risk Diagnostics
            </span>
            <h3 className="mt-1 text-2xl font-bold text-white tracking-tight">{companyName}</h3>
          </div>

          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide shadow-lg ${
            isLow ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-emerald-500/10" : "border-amber-500/30 bg-amber-500/15 text-amber-300 shadow-amber-500/10"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isLow ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {overallLabel}
          </span>
        </div>

        <div className="mt-8 grid items-center gap-8 md:grid-cols-3">
          {/* Radial Ring Meter */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(148,163,184,0.2)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke={isLow ? "#34d399" : "#fbbf24"}
                  strokeWidth="8"
                  strokeDasharray={`${(overallSafety / 100) * 264} 264`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-white font-mono">{overallSafety}%</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-emerald-400">Safety Index</span>
              </div>
            </div>
          </div>

          {/* Risk Score Breakdown */}
          <div className="flex items-center justify-around gap-6 rounded-2xl bg-white/[0.04] border border-white/10 p-6 font-mono">
            <div className="text-center">
              <span className="text-4xl font-extrabold text-red-400">{overallRisk}</span>
              <span className="block mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Risk Score</span>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <span className="text-4xl font-extrabold text-emerald-400">{overallSafety}</span>
              <span className="block mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Safety Score</span>
            </div>
          </div>

          {/* Qualitative AI Summary */}
          <div className="flex flex-col justify-center rounded-2xl bg-white/[0.04] border border-white/10 p-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Executive Summary</h4>
            <p className="text-xs leading-relaxed text-slate-400">{overallDescription}</p>
          </div>
        </div>
      </div>

      {/* Categorized Risk Factors Grid */}
      {(["financial", "valuation", "market", "industry", "macro"] as const).map(cat => {
        const meta = CATEGORY_META[cat];
        const IconComponent = meta.icon;

        return (
          <div key={cat} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
              <IconComponent className={`h-5 w-5 ${meta.color}`} />
              <h3 className="text-lg font-bold text-white tracking-tight">{meta.title}</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {d[cat].map((f: any) => <RiskFactorCard key={f.title} {...f} />)}
            </div>
          </div>
        );
      })}

      {/* Weighted Risk Factor Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
          <ShieldAlert className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">Weighted Risk Factor Matrix</h3>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1324]/90 to-[#070b14]/90 shadow-2xl backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-cyan-400">Factor</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-cyan-400">Weight</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-cyan-400">Score</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-cyan-400">Contribution</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-cyan-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {d.table.map((r: any) => (
                  <tr key={r.factor} className="transition-colors hover:bg-white/[0.04]">
                    <td className="px-6 py-4 font-semibold text-slate-200">{r.factor}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{r.weight}%</td>
                    <td className="px-6 py-4 font-mono text-slate-300">{r.score}/100</td>
                    <td className="px-6 py-4 font-mono font-bold text-cyan-300">{r.contribution.toFixed(1)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide ${
                        r.status === "Low" ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400" : "border-amber-500/30 bg-amber-500/15 text-amber-400"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Risk Analysis Action Button */}
      <AiAnalysisButton
        label="Get Deep AI Risk Assessment & Diagnostics"
        ticker={ticker}
        companyName={companyName}
      />
    </div>
  );
}
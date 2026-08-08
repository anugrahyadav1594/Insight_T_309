"use client";

import { useMemo } from "react";
import RiskFactorCard from "./shared/RiskFactorCard";
import AiAnalysisButton from "./shared/AiAnalysisButton";
import { getCompanyInfo } from "@/lib/companyData";
import type { CompanyAnalysisResponse } from "@/lib/types";

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

export default function RiskAssessmentPage({ ticker, companyName, analysisData }: Props) {
  const companyInfo = useMemo(() => getCompanyInfo(ticker), [ticker]);
  const d = useMemo(() => getCompanyRisk(companyInfo), [companyInfo]);
  const riskObj = (analysisData?.scores as any)?.risk;

  const overallRisk = riskObj?.score != null ? Math.round(Number(riskObj.score)) : d.overallRisk;
  const overallSafety = 100 - overallRisk;
  const overallLabel = riskObj?.category || (overallRisk < 35 ? "Low Risk" : overallRisk < 65 ? "Moderate Risk" : "High Risk");
  const overallDescription = (analysisData?.ai as any)?.risk_summary || d.overallDescription;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Overall Risk Assessment</p>
        <h3 className="mt-1 text-xl font-bold text-white">{companyName}</h3>
        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <div className="flex flex-col items-center"><span className="text-4xl font-bold text-red-400">{overallRisk}</span><span className="text-xs text-slate-500">RISK</span></div>
          <div className="h-16 w-px bg-white/[0.08]" />
          <div className="flex flex-col items-center"><span className="text-4xl font-bold text-emerald-400">{overallSafety}</span><span className="text-xs text-slate-500">SAFETY</span></div>
          <div className="flex flex-col items-center sm:ml-8">
            <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${overallLabel === "Low Risk" ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-400" : "border-amber-500/20 bg-amber-500/15 text-amber-400"}`}>{overallLabel}</span>
            <p className="mt-3 max-w-sm text-center text-sm text-slate-400">{overallDescription}</p>
          </div>
        </div>
      </div>
      {(["financial","valuation","market","industry","macro"] as const).map(cat => (
        <div key={cat}>
          <h3 className="mb-4 text-lg font-semibold text-white">{cat === "financial" ? "Financial Risk" : cat === "valuation" ? "Valuation Risk" : cat === "market" ? "Market Risk" : cat === "industry" ? "Industry Risk" : "Macro & Execution Risk"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">{d[cat].map((f: any) => <RiskFactorCard key={f.title} {...f} />)}</div>
        </div>
      ))}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Weighted Risk Factor Table</h3>
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-white/[0.06]">
              <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Factor</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Weight</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Score</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contribution</th>
              <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
            </tr></thead>
            <tbody>{d.table.map((r: any, i: number) => (
              <tr key={r.factor} className={`border-b border-white/[0.03] ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                <td className="px-5 py-3 font-medium text-slate-200">{r.factor}</td>
                <td className="px-5 py-3 text-slate-400">{r.weight}%</td>
                <td className="px-5 py-3 text-slate-400">{r.score}/100</td>
                <td className="px-5 py-3 font-medium text-slate-300">{r.contribution.toFixed(1)}</td>
                <td className="px-5 py-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${r.status === "Low" ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-400" : "border-amber-500/20 bg-amber-500/15 text-amber-400"}`}>{r.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <AiAnalysisButton label="Get AI Risk Analysis" />
    </div>
  );
}
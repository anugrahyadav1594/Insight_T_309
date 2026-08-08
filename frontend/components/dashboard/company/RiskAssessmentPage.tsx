"use client";

import RiskFactorCard from "./shared/RiskFactorCard";
import AiAnalysisButton from "./shared/AiAnalysisButton";
import type { CompanyAnalysisResponse } from "@/lib/types";

interface Props {
  ticker: string;
  companyName: string;
  analysisData?: CompanyAnalysisResponse | null;
}

const riskData: Record<string, any> = {
  RELIANCE: {
    overallRisk: 29, overallSafety: 71, overallLabel: "Low Risk",
    overallDescription: "This stock has relatively low risk factors. Favorable profile.",
    financial: [
      { title: "Leverage Risk", description: "Debt/Equity at 0.60x", score: 15, status: "Low Risk" },
      { title: "Coverage Risk", description: "Interest coverage at 8.2x", score: 22, status: "Low Risk" },
      { title: "Earnings Stability", description: "Volatile due to commodities", score: 38, status: "Moderate Risk" },
      { title: "Margin Risk", description: "Net margins stable ~8-9%", score: 35, status: "Moderate Risk" },
    ],
    valuation: [
      { title: "Valuation Risk", description: "P/E inline with sector", score: 30, status: "Low Risk" },
      { title: "Expectation Risk", description: "Moderate expectations", score: 25, status: "Low Risk" },
      { title: "Growth Premia", description: "Fairly priced growth", score: 28, status: "Low Risk" },
    ],
    market: [
      { title: "Beta Risk", description: "Beta ~ 1.05", score: 32, status: "Moderate Risk" },
      { title: "Liquidity Risk", description: "High trading volume", score: 10, status: "Low Risk" },
      { title: "Volatility Risk", description: "30D Volatility ~ 28.5%", score: 35, status: "Moderate Risk" },
    ],
    industry: [
      { title: "Competitive Risk", description: "Strong market position", score: 20, status: "Low Risk" },
      { title: "Regulatory Risk", description: "Telecom & Energy regulations", score: 42, status: "Moderate Risk" },
    ],
    macro: [
      { title: "Interest Rate Risk", description: "Moderate sensitivity", score: 30, status: "Low Risk" },
      { title: "Currency Risk", description: "Import/Export exposure", score: 35, status: "Moderate Risk" },
    ],
    table: [
      { factor: "Financial Risk", weight: 30, score: 28, contribution: 8.4, status: "Low" },
      { factor: "Valuation Risk", weight: 25, score: 27, contribution: 6.8, status: "Low" },
      { factor: "Market Risk", weight: 20, score: 26, contribution: 5.2, status: "Low" },
      { factor: "Industry Risk", weight: 15, score: 31, contribution: 4.7, status: "Moderate" },
      { factor: "Macro Risk", weight: 10, score: 325, contribution: 3.3, status: "Moderate" },
    ],
  },
};

export default function RiskAssessmentPage({ ticker, companyName, analysisData }: Props) {
  const d = riskData[ticker] || riskData.RELIANCE;
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
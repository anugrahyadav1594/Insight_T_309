"use client";

/**
 * RiskAssessmentPage — Risk Assessment tab.
 * 
 * IMPORT PATHS for your project:
 *   import RiskFactorCard from "./shared/RiskFactorCard";
 *   import ScoreRing from "./shared/ScoreRing";
 *   import AiAnalysisButton from "./shared/AiAnalysisButton";
 */

import RiskFactorCard from "./RiskFactorCard";
import AiAnalysisButton from "./AiAnalysisButton";

interface RiskAssessmentPageProps { ticker: string; companyName: string }

const riskData: Record<string, any> = {
  RELIANCE: {
    overallRisk: 29, overallSafety: 71, overallLabel: "Low Risk",
    overallDescription: "This stock has relatively low risk factors. Favorable profile for long-term investors.",
    financial: [
      { title: "Leverage Risk", description: "Debt/Equity at 0.60x — moderate leverage for a conglomerate", score: 15, status: "Low Risk" },
      { title: "Coverage Risk", description: "Interest coverage at 8.2x — adequate debt servicing ability", score: 22, status: "Low Risk" },
      { title: "Earnings Stability Risk", description: "Earnings volatile due to commodity exposure", score: 38, status: "Moderate Risk" },
      { title: "Margin Risk", description: "Net margins stable around 8-9%", score: 35, status: "Moderate Risk" },
    ],
    valuation: [
      { title: "Valuation Risk", description: "P/E inline with sector average", score: 30, status: "Low Risk" },
      { title: "Expectation Risk", description: "Moderate market expectations on green energy", score: 25, status: "Low Risk" },
    ],
    market: [
      { title: "Market Risk (Beta)", description: "Beta of 1.1 — slightly more volatile than market", score: 28, status: "Low Risk" },
      { title: "Volatility Risk", description: "Annualized volatility at 28.5%", score: 32, status: "Moderate Risk" },
    ],
    industry: [
      { title: "Industry Risk", description: "Cyclical energy and retail sectors", score: 30, status: "Low Risk" },
      { title: "Entry Barrier Risk", description: "High capital requirements protect incumbents", score: 18, status: "Low Risk" },
    ],
    macro: [
      { title: "Macro Risk", description: "Exposure to crude oil prices and currency", score: 42, status: "Moderate Risk" },
      { title: "Execution Risk", description: "Multiple large-scale projects in execution", score: 35, status: "Moderate Risk" },
    ],
    weightedTable: [
      { factor: "Leverage Risk", weight: 20, score: 15, contribution: 3.0, status: "Low" },
      { factor: "Coverage Risk", weight: 15, score: 22, contribution: 3.3, status: "Low" },
      { factor: "Earnings Stability", weight: 15, score: 38, contribution: 5.7, status: "Moderate" },
      { factor: "Margin Risk", weight: 10, score: 35, contribution: 3.5, status: "Moderate" },
      { factor: "Valuation Risk", weight: 15, score: 30, contribution: 4.5, status: "Low" },
      { factor: "Market Risk", weight: 10, score: 28, contribution: 2.8, status: "Low" },
      { factor: "Industry Risk", weight: 10, score: 30, contribution: 3.0, status: "Low" },
      { factor: "Macro & Execution", weight: 5, score: 38, contribution: 1.9, status: "Moderate" },
    ],
  },
  TCS: {
    overallRisk: 18, overallSafety: 82, overallLabel: "Low Risk",
    overallDescription: "Very low risk profile. High-quality business with predictable cash flows.",
    financial: [
      { title: "Leverage Risk", description: "Debt/Equity at 0.09x — virtually debt-free", score: 5, status: "Low Risk" },
      { title: "Coverage Risk", description: "Strong interest coverage", score: 8, status: "Low Risk" },
      { title: "Earnings Stability Risk", description: "Highly predictable recurring revenue", score: 15, status: "Low Risk" },
      { title: "Margin Risk", description: "Stable margins around 21%", score: 18, status: "Low Risk" },
    ],
    valuation: [
      { title: "Valuation Risk", description: "Premium valuation at 24.5x", score: 35, status: "Moderate Risk" },
      { title: "Expectation Risk", description: "High market expectations", score: 30, status: "Low Risk" },
    ],
    market: [
      { title: "Market Risk (Beta)", description: "Low beta of 0.9", score: 15, status: "Low Risk" },
      { title: "Volatility Risk", description: "Low annualized volatility at 22%", score: 20, status: "Low Risk" },
    ],
    industry: [
      { title: "Industry Risk", description: "Stable IT services sector", score: 22, status: "Low Risk" },
      { title: "Entry Barrier Risk", description: "High talent barrier", score: 20, status: "Low Risk" },
    ],
    macro: [
      { title: "Macro Risk", description: "USD/INR dependency", score: 28, status: "Low Risk" },
      { title: "Execution Risk", description: "Large team, proven delivery", score: 18, status: "Low Risk" },
    ],
    weightedTable: [
      { factor: "Leverage Risk", weight: 20, score: 5, contribution: 1.0, status: "Low" },
      { factor: "Coverage Risk", weight: 15, score: 8, contribution: 1.2, status: "Low" },
      { factor: "Earnings Stability", weight: 15, score: 15, contribution: 2.3, status: "Low" },
      { factor: "Valuation Risk", weight: 15, score: 35, contribution: 5.3, status: "Moderate" },
      { factor: "Market Risk", weight: 10, score: 15, contribution: 1.5, status: "Low" },
      { factor: "Industry Risk", weight: 10, score: 22, contribution: 2.2, status: "Low" },
      { factor: "Macro & Execution", weight: 5, score: 22, contribution: 1.1, status: "Low" },
    ],
  },
};

export default function RiskAssessmentPage({ ticker, companyName }: RiskAssessmentPageProps) {
  const data = riskData[ticker] || riskData.RELIANCE;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Overall Risk Assessment</p>
        <h3 className="mt-1 text-xl font-bold text-white">{companyName}</h3>
        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-red-400">{data.overallRisk}</span>
            <span className="text-xs text-slate-500">RISK</span>
          </div>
          <div className="h-16 w-px bg-white/[0.08]" />
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-emerald-400">{data.overallSafety}</span>
            <span className="text-xs text-slate-500">SAFETY</span>
          </div>
          <div className="flex flex-col items-center sm:ml-8">
            <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${data.overallLabel === "Low Risk" ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-400" : data.overallLabel === "Moderate Risk" ? "border-amber-500/20 bg-amber-500/15 text-amber-400" : "border-red-500/20 bg-red-500/15 text-red-400"}`}>
              {data.overallLabel}
            </span>
            <p className="mt-3 max-w-sm text-center text-sm text-slate-400">{data.overallDescription}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Financial Risk</h3>
        <div className="grid gap-4 sm:grid-cols-2">{data.financial.map((f: any) => <RiskFactorCard key={f.title} {...f} />)}</div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Valuation Risk</h3>
        <div className="grid gap-4 sm:grid-cols-2">{data.valuation.map((f: any) => <RiskFactorCard key={f.title} {...f} />)}</div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Market Risk</h3>
        <div className="grid gap-4 sm:grid-cols-2">{data.market.map((f: any) => <RiskFactorCard key={f.title} {...f} />)}</div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Industry Risk</h3>
        <div className="grid gap-4 sm:grid-cols-2">{data.industry.map((f: any) => <RiskFactorCard key={f.title} {...f} />)}</div>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Macro & Execution Risk</h3>
        <div className="grid gap-4 sm:grid-cols-2">{data.macro.map((f: any) => <RiskFactorCard key={f.title} {...f} />)}</div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Weighted Risk Factor Table</h3>
        <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Factor</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Weight</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Score</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Contribution</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.weightedTable.map((row: any, i: number) => (
                <tr key={row.factor} className={`border-b border-white/[0.03] ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                  <td className="px-5 py-3 font-medium text-slate-200">{row.factor}</td>
                  <td className="px-5 py-3 text-slate-400">{row.weight}%</td>
                  <td className="px-5 py-3 text-slate-400">{row.score}/100</td>
                  <td className="px-5 py-3 font-medium text-slate-300">{row.contribution.toFixed(1)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${row.status === "Low" ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-400" : row.status === "Moderate" ? "border-amber-500/20 bg-amber-500/15 text-amber-400" : "border-red-500/20 bg-red-500/15 text-red-400"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AiAnalysisButton label="Get AI Risk Analysis" />
    </div>
  );
}

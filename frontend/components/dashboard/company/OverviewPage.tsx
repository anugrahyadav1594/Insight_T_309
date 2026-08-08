"use client";

export default function OverviewPage({ ticker, companyName }: { ticker: string; companyName: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-xl">
      <h2 className="text-2xl font-bold text-white">Overview — {companyName}</h2>
      <p className="mt-2 text-slate-400">Ticker: {ticker}</p>
      <p className="mt-1 text-sm text-slate-500">Overview page is working. Now paste the full code.</p>
    </div>
  );
}
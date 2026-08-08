"use client";

const statusColors: Record<string, string> = {
  Good: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Fair: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Poor: "bg-red-500/15 text-red-400 border-red-500/20",
  "Low Risk": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Moderate Risk": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "High Risk": "bg-red-500/15 text-red-400 border-red-500/20",
  Neutral: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  Bullish: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Bearish: "bg-red-500/15 text-red-400 border-red-500/20",
  Overbought: "bg-red-500/15 text-red-400 border-red-500/20",
  Uptrend: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "Bear Market": "bg-red-500/15 text-red-400 border-red-500/20",
  Volatility: "bg-amber-500/15 text-amber-400 border-amber-500/20",
};

export default function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] || "bg-slate-500/15 text-slate-300 border-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      {status}
    </span>
  );
}
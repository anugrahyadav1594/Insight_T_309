"use client";

import StatusBadge from "./StatusBadge";

interface RiskFactorCardProps {
  title: string;
  description: string;
  score: number;
  status: string;
}

export default function RiskFactorCard({ title, description, score, status }: RiskFactorCardProps) {
  const isLow = status === "Low Risk" || status === "Low";
  const isMod = status === "Moderate Risk" || status === "Moderate";

  const barColor = isLow ? "from-emerald-500 to-teal-400" : isMod ? "from-amber-500 to-yellow-400" : "from-red-500 to-rose-400";
  const badgeColor = isLow ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]" : isMod ? "text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]" : "text-red-400 bg-red-500/10 border-red-500/30 shadow-[0_0_12px_rgba(248,113,113,0.15)]";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c1324]/90 to-[#070b14]/90 p-5 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</h4>
        <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-semibold tracking-wide ${badgeColor}`}>
          {status}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400 leading-relaxed">{description}</p>
      
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Low Risk</span>
          <span className="font-bold text-slate-300">Score: {score}/100</span>
          <span>High Risk</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06] p-0.5">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`}
            style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
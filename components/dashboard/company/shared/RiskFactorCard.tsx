"use client";

/**
 * RiskFactorCard — reusable card for individual risk factors.
 */

import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

interface RiskFactorCardProps {
  title: string;
  description: string;
  score: number;
  status: string;
}

export default function RiskFactorCard({ title, description, score, status }: RiskFactorCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/[0.12]">
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">{title}</h4>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      <div className="mt-4">
        <ProgressBar score={score} leftLabel="Low Risk" rightLabel="High Risk" />
      </div>
    </div>
  );
}

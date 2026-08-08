"use client";

interface ProgressBarProps {
  score: number;
  leftLabel?: string;
  rightLabel?: string;
  showScore?: boolean;
}

export default function ProgressBar({
  score,
  leftLabel = "Low Risk",
  rightLabel = "High Risk",
  showScore = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = clamped <= 25 ? "bg-emerald-400" : clamped <= 50 ? "bg-amber-400" : clamped <= 75 ? "bg-orange-400" : "bg-red-400";

  return (
    <div className="w-full">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-amber-500/30 to-red-500/30" />
        <div
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white/80 ${color} shadow-lg transition-all duration-500`}
          style={{ left: `${clamped}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>{leftLabel}</span>
        {showScore && <span className="font-medium text-slate-300">Score: {score}/100</span>}
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
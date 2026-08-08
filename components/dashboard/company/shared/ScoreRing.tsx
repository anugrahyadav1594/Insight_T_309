"use client";

/**
 * ScoreRing — circular progress ring for analysis scores.
 */

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
}

function getScoreColor(score: number, maxScore: number): string {
  const pct = score / maxScore;
  if (pct >= 0.7) return "#34d399";
  if (pct >= 0.4) return "#fbbf24";
  return "#f87171";
}

function getScoreLabel(score: number, maxScore: number): string {
  const pct = score / maxScore;
  if (pct >= 0.7) return "Good";
  if (pct >= 0.4) return "Fair";
  return "Poor";
}

export default function ScoreRing({
  score,
  maxScore = 100,
  label,
  sublabel,
  size = 100,
  strokeWidth = 8,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score / maxScore, 1);
  const offset = circumference - progress * circumference;
  const color = getScoreColor(score, maxScore);
  const statusLabel = sublabel || getScoreLabel(score, maxScore);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
          <span className="text-[10px] text-slate-400">/ {maxScore}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs" style={{ color }}>{statusLabel}</p>
      </div>
    </div>
  );
}

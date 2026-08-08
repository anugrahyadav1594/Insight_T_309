"use client";

/**
 * MetricCard — displays a single key metric with title and value.
 */

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: "default" | "positive" | "negative" | "warning";
}

const accentColors = {
  default: "text-white",
  positive: "text-emerald-400",
  negative: "text-red-400",
  warning: "text-amber-400",
};

export default function MetricCard({ title, value, subtitle, accent = "default" }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/[0.12]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${accentColors[accent]}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

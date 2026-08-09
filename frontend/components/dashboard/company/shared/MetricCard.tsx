"use client";

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
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c1324]/90 to-[#070b14]/90 p-5 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_25px_rgba(34,211,238,0.12)] hover:-translate-y-0.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <p className={`mt-2 text-2xl font-black font-mono ${accentColors[accent]}`}>{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>}
    </div>
  );
}
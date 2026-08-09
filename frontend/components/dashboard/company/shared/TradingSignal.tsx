"use client";

import { TrendingUp, TrendingDown, Activity, Flame, ShieldAlert } from "lucide-react";

interface TradingSignalProps {
  signal: string;
  confidence: number;
  explanation: string[];
}

export default function TradingSignal({ signal, confidence, explanation }: TradingSignalProps) {
  let displaySignal = signal;
  let bg = "bg-emerald-500/15 border-emerald-500/30";
  let text = "text-emerald-400";
  let dotBg = "bg-emerald-400";
  let Icon = TrendingUp;

  const score = confidence || 70;
  const isBuySignal = signal === "BUY" || signal.includes("BULLISH");
  const isHoldSignal = signal === "HOLD" || signal.includes("NEUTRAL");
  const isSellSignal = signal === "SELL" || signal.includes("BEARISH");

  if (isBuySignal || score >= 60) {
    if (score >= 75) {
      displaySignal = "STRONG BULLISH";
      bg = "bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-emerald-500/40 shadow-[0_0_25px_rgba(52,211,153,0.15)]";
      text = "text-emerald-300";
      dotBg = "bg-emerald-400";
      Icon = Flame;
    } else {
      displaySignal = "BULLISH MOMENTUM";
      bg = "bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.1)]";
      text = "text-emerald-400";
      dotBg = "bg-emerald-400";
      Icon = TrendingUp;
    }
  } else if (isHoldSignal || (score >= 45 && score < 60)) {
    displaySignal = "NEUTRAL / CONSOLIDATING";
    bg = "bg-amber-500/15 border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]";
    text = "text-amber-400";
    dotBg = "bg-amber-400";
    Icon = Activity;
  } else if (isSellSignal || score >= 30) {
    displaySignal = "BEARISH OUTLOOK";
    bg = "bg-orange-500/15 border-orange-500/30 shadow-[0_0_20px_rgba(251,146,60,0.1)]";
    text = "text-orange-400";
    dotBg = "bg-orange-400";
    Icon = TrendingDown;
  } else {
    displaySignal = "STRONG BEARISH";
    bg = "bg-red-500/15 border-red-500/30 shadow-[0_0_25px_rgba(248,113,113,0.15)]";
    text = "text-red-400";
    dotBg = "bg-red-400";
    Icon = ShieldAlert;
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl border p-6 ${bg} backdrop-blur-2xl transition-all duration-300`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} border border-white/10 shadow-lg`}>
            <Icon className={`h-7 w-7 ${text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-black tracking-tight ${text}`}>{displaySignal}</span>
              <span className={`h-2 w-2 rounded-full ${dotBg} animate-pulse`} />
            </div>
            <p className="text-xs font-mono font-medium text-slate-400 mt-0.5">{confidence}% AI Technical Confidence Score</p>
          </div>
        </div>

        {/* Confidence Meter Bar */}
        <div className="w-full max-w-xs space-y-1.5 font-mono text-[10px]">
          <div className="flex justify-between text-slate-400 font-semibold">
            <span>Bearish</span>
            <span className={text}>{confidence}% Alignment</span>
            <span>Bullish</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 p-0.5">
            <div
              className={`h-full rounded-full ${dotBg} transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(100, Math.max(5, confidence))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4 grid gap-2 sm:grid-cols-2">
        {explanation.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotBg}`} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
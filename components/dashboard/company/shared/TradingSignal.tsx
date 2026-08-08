"use client";

/**
 * TradingSignal — displays a BUY / HOLD / SELL signal with confidence.
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TradingSignalProps {
  signal: "BUY" | "HOLD" | "SELL";
  confidence: number;
  explanation: string[];
}

const signalConfig = {
  BUY: { bg: "bg-emerald-500/15 border-emerald-500/20", text: "text-emerald-400", icon: TrendingUp, glow: "shadow-emerald-500/10" },
  HOLD: { bg: "bg-amber-500/15 border-amber-500/20", text: "text-amber-400", icon: Minus, glow: "shadow-amber-500/10" },
  SELL: { bg: "bg-red-500/15 border-red-500/20", text: "text-red-400", icon: TrendingDown, glow: "shadow-red-500/10" },
};

export default function TradingSignal({ signal, confidence, explanation }: TradingSignalProps) {
  const config = signalConfig[signal];
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border p-6 ${config.bg} backdrop-blur-xl shadow-lg ${config.glow}`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.bg}`}>
          <Icon className={`h-7 w-7 ${config.text}`} />
        </div>
        <div>
          <p className={`text-3xl font-bold ${config.text}`}>{signal}</p>
          <p className="text-sm text-slate-400">{confidence}% Confidence</p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {explanation.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${config.text.replace("text-", "bg-")}`} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

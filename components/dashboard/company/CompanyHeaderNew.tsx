"use client";

/**
 * CompanyHeaderNew — data-driven company header.
 * Place at: components/dashboard/company/CompanyHeaderNew.tsx
 */

import { TrendingUp, TrendingDown } from "lucide-react";

interface CompanyHeaderProps {
  name: string;
  ticker: string;
  exchange?: string;
  sector?: string;
  price?: number;
  change?: number;
  chips?: string[];
}

export default function CompanyHeader({
  name, ticker, exchange = "NSE", sector, price, change, chips = [],
}: CompanyHeaderProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{name}</h1>
        <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-sm font-medium text-slate-300">{ticker}</span>
        {sector && <span className="text-sm text-slate-500">{sector}</span>}
      </div>
      {price !== undefined && (
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-3xl font-bold text-white sm:text-4xl">
            ₹{price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          {change !== undefined && (
            <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {isPositive ? "+" : ""}{change.toFixed(2)}%
            </span>
          )}
        </div>
      )}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-slate-400">{chip}</span>
          ))}
        </div>
      )}
    </div>
  );
}

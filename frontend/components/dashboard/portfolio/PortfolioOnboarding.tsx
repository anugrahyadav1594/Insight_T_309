"use client";

import { useState } from "react";
import { Plus, Briefcase, Loader2 } from "lucide-react";

import { createPortfolio, addHolding } from "@/lib/portfolioService";

interface PortfolioOnboardingProps {
  /** Called with the new portfolio id once created + holdings added. */
  onCreated: (portfolioId: string) => void;
}

/* Common tickers to make adding easy. */
const SUGGESTED_TICKERS = ["TCS", "INFY", "RELIANCE", "HDFCBANK", "ITC", "SBIN", "LT", "SUNPHARMA"];

export default function PortfolioOnboarding({ onCreated }: PortfolioOnboardingProps) {
  const [name, setName] = useState("My Portfolio");
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [buyPrice, setBuyPrice] = useState("");
  const [holdings, setHoldings] = useState<Array<{ ticker: string; quantity: number; buyPrice: number }>>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addHoldingLocal = () => {
    const sym = ticker.trim().toUpperCase();
    const qty = parseFloat(quantity);
    const price = parseFloat(buyPrice);
    if (!sym || qty <= 0 || price <= 0) {
      setError("Enter a valid ticker, quantity > 0 and buy price > 0");
      return;
    }
    if (holdings.some((h) => h.ticker === sym)) {
      setError(`${sym} is already added`);
      return;
    }
    setHoldings((prev) => [...prev, { ticker: sym, quantity: qty, buyPrice: price }]);
    setError(null);
    setTicker(""); setQuantity("1"); setBuyPrice("");
  };

  const createAndAdd = async () => {
    if (!name.trim()) { setError("Enter a portfolio name"); return; }
    setCreating(true);
    setError(null);
    try {
      const portfolio = await createPortfolio(name.trim());
      // Add each holding.
      for (const h of holdings) {
        try {
          await addHolding(portfolio.id, h.ticker, h.quantity, h.buyPrice);
        } catch {
          // skip tickers that don't exist in the companies table
        }
      }
      onCreated(portfolio.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create portfolio");
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-[32px] border border-cyan-400/20 bg-white/5 p-8 backdrop-blur-3xl">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400"><Briefcase className="h-6 w-6" /></div>
        <div>
          <h2 className="text-2xl font-bold text-white">Create your first portfolio</h2>
          <p className="text-sm text-slate-400">Add your holdings, then use "What if" to explore changes.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Portfolio name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Add holdings</h3>
          <div className="flex flex-wrap items-end gap-2">
            <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="TCS" className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none" />
            <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none" />
            <input type="number" min="0" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="Avg Buy ₹" className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none" />
            <button onClick={addHoldingLocal} className="flex items-center gap-1 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_TICKERS.map((t) => (
              <button key={t} onClick={() => setTicker(t)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:border-cyan-400/40 hover:text-white">
                {t}
              </button>
            ))}
          </div>
        </div>

        {holdings.length > 0 && (
          <div className="space-y-1.5">
            {holdings.map((h) => (
              <div key={h.ticker} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className="font-semibold text-white">{h.ticker}</span>
                <span className="text-slate-400">{h.quantity} @ ₹{h.buyPrice}</span>
                <button onClick={() => setHoldings((prev) => prev.filter((x) => x.ticker !== h.ticker))} className="text-slate-500 hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={createAndAdd}
          disabled={creating}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.01] disabled:opacity-50"
        >
          {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create Portfolio & Start Tracking"}
        </button>
      </div>
    </div>
  );
}

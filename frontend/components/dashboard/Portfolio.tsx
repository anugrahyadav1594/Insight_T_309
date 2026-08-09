"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2, Wand2, X, Plus, Trash2, RotateCcw } from "lucide-react";

import PortfolioHeader from "./portfolio/PortfolioHeader";
import PortfolioStats from "./portfolio/PortfolioStats";
import Contributors from "./portfolio/Contributors";
import HoldingsTable from "./portfolio/HoldingsTable";
import HoldingsChart from "./portfolio/HoldingsChart";
import AIAnalysisButton from "./portfolio/AIAnalysisButton";
import AIAnalysisModal from "./portfolio/AIAnalysisModal";
import PortfolioOnboarding from "./portfolio/PortfolioOnboarding";

import {
  portfolio as mockPortfolio,
  holdings as mockHoldings,
  getTopContributors,
  getBottomLaggards,
} from "@/lib/portfolioData";
import type { Holding, PortfolioSummary } from "@/lib/portfolioData";

import { listPortfolios, getPortfolio, ApiError } from "@/lib/api";
import type { HoldingOut, PortfolioDetail } from "@/lib/types";
import { runWhatIf } from "@/lib/portfolioService";

interface PortfolioProps {
  onBack?: () => void;
  onViewStock?: (symbol: string) => void;
}

interface EditRow {
  key: string;
  symbol: string;
  name: string;
  qty: number;
  avg: number;
}

/* Map a backend PortfolioDetail (holding list) into the frontend Holding[] shape. */
function mapDetailToHoldings(detail: PortfolioDetail): Holding[] {
  return detail.holdings.map((h: HoldingOut) => ({
    symbol: h.ticker,
    name: h.name,
    qty: h.quantity,
    avg: h.average_buy_price,
    current: h.price ?? h.current_value / h.quantity,
    dayChange: 0,
    weight: h.weight,
    fundScore: h.overall_score ?? 0,
    techScore: 50,
    riskScore: 0,
  }));
}

/* Map a backend PortfolioDetail into the frontend PortfolioSummary shape. */
function mapDetailToSummary(detail: PortfolioDetail): PortfolioSummary {
  return {
    totalValue: detail.summary.total_value,
    todayPnL: detail.summary.total_pl,
    totalReturn: detail.summary.total_pl_pct,
    riskScore: detail.scores.risk ?? 0,
    mixedScore: detail.scores.overall ?? 0,
    fundamentalScore: detail.scores.fundamental ?? 0,
    technicalScore: detail.scores.technical ?? 0,
  };
}

export default function Portfolio({ onBack, onViewStock }: PortfolioProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Real portfolio (from backend). */
  const [portfolioData, setPortfolioData] = useState<PortfolioSummary>(mockPortfolio);
  const [holdingsData, setHoldingsData] = useState<Holding[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("insight_user_portfolio_holdings");
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return mockHoldings;
  });

  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [realHoldings, setRealHoldings] = useState<HoldingOut[]>([]);

  /* True when the user has no portfolios yet (Google login, first time). */
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  /* What-if simulation. */
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [editRows, setEditRows] = useState<EditRow[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<PortfolioDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const list = await listPortfolios();
        if (cancelled) return;
        if (list.items.length === 0) {
          setNeedsOnboarding(true);
          setLoading(false);
          return;
        }

        const detail = await getPortfolio(list.items[0].id);
        if (cancelled) return;

        setPortfolioId(detail.id);
        setRealHoldings(detail.holdings);
        setPortfolioData(mapDetailToSummary(detail));
        const mapped = mapDetailToHoldings(detail);
        setHoldingsData(mapped.length > 0 ? mapped : mockHoldings);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "DEMO_MODE") {
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load portfolio");
        }
        setPortfolioData(mockPortfolio);
        setHoldingsData(mockHoldings);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  /* What-if displayed data: use simResult when available, else the real data. */
  const displaySummary: PortfolioSummary = simResult ? mapDetailToSummary(simResult) : portfolioData;
  const displayHoldings: Holding[] = simResult
    ? (mapDetailToHoldings(simResult).length > 0 ? mapDetailToHoldings(simResult) : holdingsData)
    : holdingsData;

  const topContributors = useMemo(() => getTopContributors(displayHoldings, 3), [displayHoldings]);
  const bottomLaggards = useMemo(() => getBottomLaggards(displayHoldings, 3), [displayHoldings]);
  const totalValue = useMemo(
    () => displayHoldings.reduce((sum, h) => sum + h.current * h.qty, 0),
    [displayHoldings],
  );

  /* After a user creates their first portfolio, reload it. */
  const handlePortfolioCreated = useCallback(() => {
    setNeedsOnboarding(false);
    // Reload the portfolio list + first portfolio.
    (async () => {
      try {
        const list = await listPortfolios();
        if (list.items.length === 0) { setNeedsOnboarding(true); return; }
        const detail = await getPortfolio(list.items[0].id);
        setPortfolioId(detail.id);
        setRealHoldings(detail.holdings);
        setPortfolioData(mapDetailToSummary(detail));
        const mapped = mapDetailToHoldings(detail);
        setHoldingsData(mapped.length > 0 ? mapped : mockHoldings);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load portfolio");
      }
    })();
  }, []);

  const enterWhatIf = useCallback(() => {
    setEditRows(
      holdingsData.map((h) => ({
        key: h.symbol,
        symbol: h.symbol,
        name: h.name,
        qty: h.qty,
        avg: h.avg,
      })),
    );
    setSimResult(null);
    setSimError(null);
    setWhatIfMode(true);
  }, [holdingsData]);

  const exitWhatIf = useCallback(() => {
    setWhatIfMode(false);
    setEditRows([]);
    setSimResult(null);   // revert to real data
    setSimError(null);
  }, []);

  const updateRow = useCallback((key: string, patch: Partial<EditRow>) => {
    setEditRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = useCallback((key: string) => {
    setEditRows((prev) => prev.filter((r) => r.key !== key));
  }, []);

  const addRow = useCallback(() => {
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;
    setEditRows((prev) => {
      if (prev.some((r) => r.symbol.toUpperCase() === symbol)) {
        setSimError(`${symbol} is already in the simulation`);
        return prev;
      }
      setSimError(null);
      return [...prev, { key: `${symbol}-${Date.now()}`, symbol, name: symbol, qty: parseFloat(newQty) || 1, avg: parseFloat(newPrice) || 0 }];
    });
    setNewSymbol(""); setNewQty("1"); setNewPrice("");
  }, [newSymbol, newQty, newPrice]);

  const runSimulation = useCallback(async () => {
    if (!portfolioId) return;
    setSimulating(true);
    setSimError(null);
    try {
      const changes: Array<{ ticker: string; quantity?: number | null; average_buy_price?: number | null; action: "add" | "update" | "remove" }> = [];

      const rowSymbols = new Set(editRows.map((r) => r.symbol.toUpperCase()));
      for (const h of realHoldings) {
        if (!rowSymbols.has(h.ticker.toUpperCase())) {
          changes.push({ ticker: h.ticker, action: "remove" });
        }
      }

      const realSymbols = new Set(realHoldings.map((h) => h.ticker.toUpperCase()));
      for (const r of editRows) {
        const action = realSymbols.has(r.symbol.toUpperCase()) ? "update" : "add";
        changes.push({ ticker: r.symbol, quantity: r.qty, average_buy_price: r.avg, action });
      }

      const result = await runWhatIf(portfolioId, changes);
      setSimResult(result);   // drives the displayed stats/table/chart
    } catch (e) {
      setSimError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setSimulating(false);
    }
  }, [portfolioId, editRows, realHoldings]);

  if (loading) {
    return (
      <div className="relative min-h-screen px-6 pt-24 pb-20 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm text-slate-400">Loading portfolio...</p>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
          <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
        </div>
        <div className="mx-auto max-w-7xl px-8">
          <PortfolioHeader onBack={onBack} />
          <div className="mt-10 flex justify-center">
            <PortfolioOnboarding onCreated={handlePortfolioCreated} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-screen px-6 pt-24 pb-20 text-white transition-colors duration-500 ${
        whatIfMode ? "bg-amber-950/20" : ""
      }`}
    >
      {/* Background Glows — amber in what-if mode, cyan otherwise */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {whatIfMode ? (
          <>
            <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-amber-500/15 blur-[160px]" />
            <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-purple-600/15 blur-[160px]" />
          </>
        ) : (
          <>
            <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
            <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
          </>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-8">
        {error && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            ⚠️ Using demo data — {error}
          </div>
        )}

        <PortfolioHeader
          onBack={onBack}
          onToggleWhatIf={enterWhatIf}
          whatIfMode={whatIfMode}
          onExitWhatIf={exitWhatIf}
        />

        {/* What-if simulation panel */}
        {whatIfMode && (
          <div className="mt-6 rounded-[28px] border border-amber-400/40 bg-gradient-to-br from-amber-500/[0.12] via-white/[0.03] to-purple-600/[0.12] p-6 backdrop-blur-3xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-amber-200">
                <Wand2 className="h-5 w-5" /> What If Simulation
              </h3>
              <button
                onClick={exitWhatIf}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Edit quantities &amp; buy prices, add or remove holdings, then recompute. The dashboard reflects your changes.
            </p>

            <div className="mt-4 space-y-2">
              {editRows.map((r) => (
                <div key={r.key} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
                  <div className="w-24 font-bold text-white">{r.symbol}</div>
                  <div className="hidden flex-1 text-xs text-slate-400 sm:block">{r.name}</div>
                  <label className="flex items-center gap-1 text-xs text-slate-400">
                    Qty
                    <input
                      type="number" min="0" value={r.qty}
                      onChange={(e) => updateRow(r.key, { qty: parseFloat(e.target.value) || 0 })}
                      className="w-20 rounded-lg border border-amber-300/30 bg-white/5 px-2 py-1 text-right text-white focus:border-amber-300 focus:outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-slate-400">
                    Buy
                    <input
                      type="number" min="0" value={r.avg}
                      onChange={(e) => updateRow(r.key, { avg: parseFloat(e.target.value) || 0 })}
                      className="w-24 rounded-lg border border-amber-300/30 bg-white/5 px-2 py-1 text-right text-white focus:border-amber-300 focus:outline-none"
                    />
                  </label>
                  <button
                    onClick={() => removeRow(r.key)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                    aria-label={`Remove ${r.symbol}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-slate-400">Ticker</label>
                <input value={newSymbol} onChange={(e) => setNewSymbol(e.target.value.toUpperCase())} placeholder="TCS" className="w-28 rounded-lg border border-amber-300/30 bg-white/5 px-3 py-2 text-white focus:border-amber-300 focus:outline-none" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-slate-400">Qty</label>
                <input type="number" min="0" value={newQty} onChange={(e) => setNewQty(e.target.value)} className="w-20 rounded-lg border border-amber-300/30 bg-white/5 px-3 py-2 text-white focus:border-amber-300 focus:outline-none" />
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xs text-slate-400">Avg Buy</label>
                <input type="number" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="3400" className="w-24 rounded-lg border border-amber-300/30 bg-white/5 px-3 py-2 text-white focus:border-amber-300 focus:outline-none" />
              </div>
              <button onClick={addRow} className="flex items-center gap-1 rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            {simError && <p className="mt-3 text-xs text-red-400">{simError}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={runSimulation}
                disabled={simulating}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition hover:scale-[1.03] disabled:opacity-50"
              >
                {simulating ? "Simulating…" : <><Wand2 className="h-4 w-4" /> Recompute Scores</>}
              </button>

              {simResult && (
                <span className="text-sm text-emerald-300">
                  Updated overall: {simResult.scores.overall != null ? simResult.scores.overall.toFixed(1) : "—"}
                  {" "}· Total value: ₹{simResult.summary.total_value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats now show the simulated values in what-if mode */}
        <PortfolioStats data={displaySummary} />
        <Contributors
          topContributors={topContributors}
          bottomLaggards={bottomLaggards}
          totalValue={totalValue}
          onViewStock={onViewStock}
        />
        <HoldingsChart holdings={displayHoldings} totalValue={totalValue} />
        <HoldingsTable holdings={displayHoldings} onViewStock={onViewStock} />
        <AIAnalysisButton onClick={() => setIsModalOpen(true)} />
      </div>

      <AIAnalysisModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

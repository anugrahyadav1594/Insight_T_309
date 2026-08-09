"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  Wand2,
  RotateCcw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import {
  fetchPortfolioDetail,
  fetchPortfolios,
  fetchWhatIf,
} from "@/lib/portfolioService";
import type {
  HoldingOut,
  PortfolioDetail,
  PortfolioScores,
  WhatIfHolding,
} from "@/lib/types";

/* A row in "what if" edit mode. */
interface EditRow {
  key: string;
  ticker: string;
  name: string;
  quantity: number;
  average_buy_price: number;
}

/* Empty-state component used when there are no portfolios. */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center">
      <p className="text-lg font-semibold text-white">No portfolios yet</p>
      <p className="mt-1 max-w-sm text-sm text-slate-400">
        Create a portfolio to start tracking your holdings and see "What if"
        simulations.
      </p>
    </div>
  );
}

export default function PortfolioTab() {
  const [detail, setDetail] = useState<PortfolioDetail | null>(null);
  const [simDetail, setSimDetail] = useState<PortfolioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* "What if" mode */
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [rows, setRows] = useState<EditRow[]>([]);
  const [newTicker, setNewTicker] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  /* Load the first portfolio on mount. */
  const loadPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchPortfolios();
      if (list.items.length > 0) {
        const firstId = list.items[0].id;
        const d = await fetchPortfolioDetail(firstId);
        setDetail(d);
        setSimDetail(null);
      } else {
        setDetail(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  /* Enter "What if" mode: copy real holdings into editable rows. */
  const enterWhatIf = useCallback(() => {
    if (!detail) return;
    setRows(
      detail.holdings.map((h) => ({
        key: h.id || h.ticker,
        ticker: h.ticker,
        name: h.name,
        quantity: h.quantity,
        average_buy_price: h.average_buy_price,
      })),
    );
    setSimDetail(null);
    setAddError(null);
    setWhatIfMode(true);
  }, [detail]);

  const exitWhatIf = useCallback(() => {
    setWhatIfMode(false);
    setSimDetail(null);
    setRows([]);
    setAddError(null);
  }, []);

  /* Update a row's field. */
  const updateRow = useCallback((key: string, patch: Partial<EditRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  /* Remove a row. */
  const removeRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }, []);

  /* Add a new ticker to the simulation. */
  const addRow = useCallback(() => {
    const ticker = newTicker.trim().toUpperCase();
    if (!ticker) return;
    setRows((prev) => {
      if (prev.some((r) => r.ticker.toUpperCase() === ticker)) {
        setAddError(`${ticker} is already in the simulation`);
        return prev;
      }
      setAddError(null);
      return [
        ...prev,
        {
          key: `${ticker}-${Date.now()}`,
          ticker,
          name: ticker,
          quantity: parseFloat(newQty) || 1,
          average_buy_price: parseFloat(newPrice) || 0,
        },
      ];
    });
    setNewTicker("");
    setNewQty("1");
    setNewPrice("");
  }, [newTicker, newQty, newPrice]);

  /*
   * Run the simulation: build add/update/remove ops from the current rows
   * relative to the real holdings, and ask the backend to recompute.
   */
  const runSimulation = useCallback(async () => {
    if (!detail) return;
    setSimulating(true);
    try {
      const changes: WhatIfHolding[] = [];

      // Removed: real holdings no longer present in rows.
      const rowTickers = new Set(rows.map((r) => r.ticker.toUpperCase()));
      for (const h of detail.holdings) {
        if (!rowTickers.has(h.ticker.toUpperCase())) {
          changes.push({ ticker: h.ticker, action: "remove" });
        }
      }

      // Added or updated: each row is add if new, update otherwise.
      const realTickers = new Set(detail.holdings.map((h) => h.ticker.toUpperCase()));
      for (const r of rows) {
        const action = realTickers.has(r.ticker.toUpperCase()) ? "update" : "add";
        changes.push({
          ticker: r.ticker,
          quantity: r.quantity,
          average_buy_price: r.average_buy_price,
          action,
        });
      }

      const result = await fetchWhatIf(detail.id, changes);
      setSimDetail(result);
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setSimulating(false);
    }
  }, [detail, rows]);

  const displayed = simDetail ?? detail;

  /* Color theme: normal = cyan/blue glass; what-if = amber/purple highlight. */
  const sectionClass = whatIfMode
    ? "border-amber-400/40 bg-gradient-to-br from-amber-500/[0.08] via-white/[0.03] to-purple-600/[0.08]"
    : "border-white/10 bg-white/[0.03]";
  const accentText = whatIfMode ? "text-amber-300" : "text-cyan-300";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400">
        Loading portfolio…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-red-300">
        {error}
      </div>
    );
  }

  if (!displayed) {
    return <EmptyState />;
  }

  return (
    <div
      className={`rounded-3xl border p-6 backdrop-blur-2xl transition-colors duration-300 ${sectionClass}`}
    >
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">{displayed.name}</h2>
          <p className={`text-sm font-medium ${accentText}`}>
            {whatIfMode ? "What If Simulation — changes are not saved" : "Portfolio"}
          </p>
        </div>

        {/* What If toggle */}
        {!whatIfMode ? (
          <button
            onClick={enterWhatIf}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-amber-300/40 hover:bg-amber-400/10 hover:text-amber-200"
          >
            <Wand2 className="h-4 w-4" />
            What if
          </button>
        ) : (
          <button
            onClick={exitWhatIf}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-all hover:border-red-400/40 hover:bg-red-500/10"
          >
            <X className="h-4 w-4" />
            Exit Simulation
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total Value" value={fmtMoney(displayed.summary.total_value)} accent={whatIfMode} />
        <MetricCard label="Invested" value={fmtMoney(displayed.summary.total_invested)} accent={whatIfMode} />
        <MetricCard
          label="P&L"
          value={fmtMoney(displayed.summary.total_pl)}
          sub={fmtPct(displayed.summary.total_pl_pct)}
          positive={displayed.summary.total_pl >= 0}
          accent={whatIfMode}
        />
        <MetricCard
          label="Overall Score"
          value={displayed.scores.overall != null ? displayed.scores.overall.toFixed(1) : "—"}
          sub={scoreBadge(displayed.scores)}
          accent={whatIfMode}
        />
      </div>

      {/* Sector concentration */}
      {displayed.sector_concentration.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-slate-300">Sector Concentration</h3>
          <div className="flex flex-wrap gap-2">
            {displayed.sector_concentration.map((c) => (
              <span
                key={c.sector}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
              >
                {c.sector} · {c.weight.toFixed(1)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Holdings table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-2 py-2">Ticker</th>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2 text-right">Qty</th>
              <th className="px-2 py-2 text-right">Avg Price</th>
              <th className="px-2 py-2 text-right">Price</th>
              <th className="px-2 py-2 text-right">Value</th>
              <th className="px-2 py-2 text-right">P&L</th>
              <th className="px-2 py-2 text-right">Weight</th>
              {whatIfMode && <th className="px-2 py-2" />}
            </tr>
          </thead>
          <tbody>
            {whatIfMode
              ? rows.map((r) => (
                  <tr key={r.key} className="border-b border-white/5">
                    <td className="px-2 py-2 font-semibold text-white">{r.ticker}</td>
                    <td className="px-2 py-2 text-slate-400">{r.name}</td>
                    <td className="px-2 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={r.quantity}
                        onChange={(e) => updateRow(r.key, { quantity: parseFloat(e.target.value) || 0 })}
                        className="w-20 rounded-lg border border-amber-300/30 bg-white/5 px-2 py-1 text-right text-white focus:border-amber-300 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        value={r.average_buy_price}
                        onChange={(e) =>
                          updateRow(r.key, { average_buy_price: parseFloat(e.target.value) || 0 })
                        }
                        className="w-24 rounded-lg border border-amber-300/30 bg-white/5 px-2 py-1 text-right text-white focus:border-amber-300 focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 text-right text-slate-300">—</td>
                    <td className="px-2 py-2 text-right text-slate-300">—</td>
                    <td className="px-2 py-2 text-right text-slate-300">—</td>
                    <td className="px-2 py-2 text-right text-slate-300">—</td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => removeRow(r.key)}
                        className="rounded-lg p-1 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                        aria-label={`Remove ${r.ticker}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              : displayed.holdings.map((h) => (
                  <tr key={h.id} className="border-b border-white/5">
                    <td className="px-2 py-2 font-semibold text-white">{h.ticker}</td>
                    <td className="px-2 py-2 text-slate-400">{h.name}</td>
                    <td className="px-2 py-2 text-right text-slate-300">{h.quantity}</td>
                    <td className="px-2 py-2 text-right text-slate-300">{fmtMoney(h.average_buy_price)}</td>
                    <td className="px-2 py-2 text-right text-slate-300">{fmtMoney(h.price)}</td>
                    <td className="px-2 py-2 text-right text-slate-300">{fmtMoney(h.current_value)}</td>
                    <td className={`px-2 py-2 text-right ${h.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmtMoney(h.pnl)}
                    </td>
                    <td className="px-2 py-2 text-right text-slate-300">{h.weight.toFixed(1)}%</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Add holding (simulation mode) */}
      {whatIfMode && (
        <div className="mt-5 rounded-2xl border border-amber-300/20 bg-white/[0.02] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-200">
            <Plus className="h-4 w-4" /> Add a holding to simulate
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label className="mb-1 text-xs text-slate-400">Ticker</label>
              <input
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                placeholder="TCS"
                className="w-32 rounded-lg border border-amber-300/30 bg-white/5 px-3 py-2 text-white focus:border-amber-300 focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs text-slate-400">Quantity</label>
              <input
                type="number"
                min="0"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-24 rounded-lg border border-amber-300/30 bg-white/5 px-3 py-2 text-white focus:border-amber-300 focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs text-slate-400">Avg Buy Price</label>
              <input
                type="number"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="3400"
                className="w-28 rounded-lg border border-amber-300/30 bg-white/5 px-3 py-2 text-white focus:border-amber-300 focus:outline-none"
              />
            </div>
            <button
              onClick={addRow}
              className="flex items-center gap-1 rounded-lg border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>
          {addError && <p className="mt-3 text-xs text-red-400">{addError}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={runSimulation}
              disabled={simulating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition hover:scale-[1.03] disabled:opacity-50"
            >
              {simulating ? "Simulating…" : <><Wand2 className="h-4 w-4" /> Recompute Scores</>}
            </button>
            <button
              onClick={exitWhatIf}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-white"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            {simDetail && (
              <span className="text-xs text-emerald-300">
                Updated: overall {simDetail.scores.overall != null ? simDetail.scores.overall.toFixed(1) : "—"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Small helpers ─────────────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  sub,
  positive,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        accent ? "border-amber-300/30 bg-white/[0.03]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
      {sub && (
        <p className={`text-xs ${positive === undefined ? "text-slate-400" : positive ? "text-emerald-400" : "text-red-400"}`}>
          {sub}
        </p>
      )}
    </div>
  );
}

function scoreBadge(scores: PortfolioScores): string {
  if (scores.overall == null) return "";
  if (scores.overall >= 75) return "Strong";
  if (scores.overall >= 60) return "Moderate";
  if (scores.overall >= 40) return "Neutral";
  return "Weak";
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "";
  const sign = n >= 0 ? "+" : "";
  return sign + n.toFixed(2) + "%";
}
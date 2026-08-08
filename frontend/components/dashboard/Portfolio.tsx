"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import PortfolioHeader from "./portfolio/PortfolioHeader";
import PortfolioStats from "./portfolio/PortfolioStats";
import Contributors from "./portfolio/Contributors";
import HoldingsTable from "./portfolio/HoldingsTable";
import HoldingsChart from "./portfolio/HoldingsChart";
import AIAnalysisButton from "./portfolio/AIAnalysisButton";
import AIAnalysisModal from "./portfolio/AIAnalysisModal";
import {
  portfolio as mockPortfolio,
  holdings as mockHoldings,
  getTopContributors,
  getBottomLaggards,
} from "@/lib/portfolioData";
import type { Holding, PortfolioSummary } from "@/lib/portfolioData";
import { listPortfolios, getPortfolio, ApiError } from "@/lib/api";
import type { HoldingOut } from "@/lib/types";

interface PortfolioProps {
  onBack?: () => void;
  onViewStock?: (symbol: string) => void;
}

export default function Portfolio({ onBack, onViewStock }: PortfolioProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioSummary>(mockPortfolio);
  const [holdingsData, setHoldingsData] = useState<Holding[]>(mockHoldings);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // 1. List portfolios
        const list = await listPortfolios();
        if (cancelled) return;

        if (list.items.length === 0) {
          // No portfolios — fall back to mock data
          setPortfolioData(mockPortfolio);
          setHoldingsData(mockHoldings);
          setLoading(false);
          return;
        }

        // 2. Fetch detail for the first portfolio
        const detail = await getPortfolio(list.items[0].id);
        if (cancelled) return;

        // 3. Map API response to the existing component interfaces
        setPortfolioData({
          totalValue: detail.summary.total_value,
          todayPnL: detail.summary.total_pl,
          totalReturn: detail.summary.total_pl_pct,
          riskScore: detail.scores.risk ?? 0,
          mixedScore: detail.scores.overall ?? 0,
          fundamentalScore: detail.scores.fundamental ?? 0,
          technicalScore: detail.scores.technical ?? 0,
        });

        const mappedHoldings: Holding[] = detail.holdings.map((h: HoldingOut) => ({
          symbol: h.ticker,
          name: h.name,
          qty: h.quantity,
          avg: h.average_buy_price,
          current: h.price ?? h.current_value / h.quantity,
          dayChange: 0, // Not provided by the detail endpoint
          weight: h.weight,
          fundScore: h.overall_score ?? 0,
          techScore: 50, // Not individually exposed by the API
          riskScore: 0, // Not individually exposed by the API
        }));

        setHoldingsData(mappedHoldings.length > 0 ? mappedHoldings : mockHoldings);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "DEMO_MODE") {
          setError(null);
        } else {
          const message = err instanceof Error ? err.message : "Failed to load portfolio";
          setError(message);
        }
        // Fall back to mock data on error
        setPortfolioData(mockPortfolio);
        setHoldingsData(mockHoldings);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const topContributors = getTopContributors(holdingsData, 3);
  const bottomLaggards = getBottomLaggards(holdingsData, 3);
  const totalValue = holdingsData.reduce((sum, h) => sum + h.current * h.qty, 0);

  if (loading) {
    return (
      <div className="relative min-h-screen px-6 pt-24 pb-20 text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm text-slate-400">Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-6 pt-24 pb-20 text-white">
      {/* Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[160px]" />
        <div className="absolute right-1/4 top-60 h-96 w-96 rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-8">
        {error && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            ⚠️ Using demo data — {error}
          </div>
        )}
        <PortfolioHeader onBack={onBack} />
        <PortfolioStats data={portfolioData} />
        <Contributors
          topContributors={topContributors}
          bottomLaggards={bottomLaggards}
          totalValue={totalValue}
        />
        <HoldingsChart holdings={holdingsData} totalValue={totalValue} />
        <HoldingsTable holdings={holdingsData} onViewStock={onViewStock} />
        <AIAnalysisButton onClick={() => setIsModalOpen(true)} />
      </div>

      <AIAnalysisModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
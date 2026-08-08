"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Filter,
} from "lucide-react";
import { getIpoCalendar } from "@/lib/api";
import type { IpoCalendarResponse, IpoItem, IPOStatus } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;
const HOVER_SPRING = { type: "spring", stiffness: 260, damping: 24, mass: 0.9 } as const;

// Fallback seed data matching backend seed dataset
const MOCK_IPO_CALENDAR: IpoCalendarResponse = {
  generated_at: new Date().toISOString(),
  ongoing: {
    status: "ongoing",
    label: "Live IPOs",
    count: 1,
    items: [
      {
        id: "ipo-1",
        ticker: "VPRPL",
        name: "Vishnu Prakash R Punglia Ltd",
        exchange: "NSE",
        sector: "Industrials",
        price_band_low: 95,
        price_band_high: 99,
        issue_size: 308,
        open_date: "2026-08-06",
        close_date: "2026-08-08",
        allotment_date: "2026-08-10",
        listing_date: "2026-08-14",
        status: "ongoing",
        description: "EPC infrastructure & water supply project construction company.",
      },
    ],
  },
  upcoming: {
    status: "upcoming",
    label: "Upcoming IPOs",
    count: 2,
    items: [
      {
        id: "ipo-2",
        ticker: "GOCOLORS",
        name: "Go Colors (Go Fashion India Ltd)",
        exchange: "NSE",
        sector: "Consumer Discretionary",
        price_band_low: 111,
        price_band_high: 115,
        issue_size: 1162,
        allotment_date: "2026-08-09",
        listing_date: "2026-08-12",
        listing_open: 125,
        listing_close: 130,
        listing_gain_pct: 13.0,
        status: "upcoming",
        description: "Women's bottom-wear apparel retail brand.",
      },
      {
        id: "ipo-3",
        ticker: "RADICO",
        name: "Radico Khaitan Ltd",
        exchange: "NSE",
        sector: "Consumer Staples",
        price_band_low: 250,
        price_band_high: 260,
        issue_size: 2100,
        allotment_date: "2026-08-28",
        listing_date: "2026-09-02",
        status: "upcoming",
        description: "Indian IMFL spirits & beverage manufacturer.",
      },
    ],
  },
  ended: {
    status: "ended",
    label: "Ended / Listed IPOs",
    count: 1,
    items: [
      {
        id: "ipo-4",
        ticker: "SWIGGY",
        name: "Swiggy Ltd",
        exchange: "NSE",
        sector: "Consumer Discretionary",
        price_band_low: 340,
        price_band_high: 345,
        issue_size: 11327,
        open_date: "2026-07-25",
        close_date: "2026-07-27",
        allotment_date: "2026-07-29",
        listing_date: "2026-08-01",
        listing_open: 360,
        listing_close: 368,
        listing_gain_pct: 6.7,
        status: "ended",
        description: "On-demand food delivery & quick-commerce platform.",
      },
    ],
  },
};

type FilterSegment = "all" | "ongoing" | "upcoming" | "ended";

export default function IpoCalendarCard() {
  const [calendarData, setCalendarData] = useState<IpoCalendarResponse>(MOCK_IPO_CALENDAR);
  const [activeSegment, setActiveSegment] = useState<FilterSegment>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getIpoCalendar()
      .then((res) => {
        if (!cancelled && res) setCalendarData(res);
      })
      .catch(() => {
        // Fall back gracefully to mock calendar data
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Combine items in RECOMMENDED ORDER: Live (Ongoing) first -> Upcoming second -> Ended/Listed third
  const ongoingItems = calendarData.ongoing?.items || [];
  const upcomingItems = calendarData.upcoming?.items || [];
  const endedItems = calendarData.ended?.items || [];

  let displayedItems: IpoItem[] = [];
  if (activeSegment === "all") {
    displayedItems = [...ongoingItems, ...upcomingItems, ...endedItems];
  } else if (activeSegment === "ongoing") {
    displayedItems = ongoingItems;
  } else if (activeSegment === "upcoming") {
    displayedItems = upcomingItems;
  } else {
    displayedItems = endedItems;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="
        group
        relative
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-white/5
        p-8
        backdrop-blur-3xl
        lg:col-span-8
        shadow-2xl
        transition-colors
        duration-500
        ease-out
        transform-gpu
        hover:border-cyan-400/40
      "
    >
      {/* Background Hover Glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      {/* Header Bar */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Rocket className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              IPO Intelligence Calendar
            </span>
          </div>
          <h3 className="mt-1 text-2xl font-bold text-white">
            Market Listings & Bidding
          </h3>
        </div>

        {/* Filter Segment Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl">
          <SegmentTab
            label="All (Recommended)"
            active={activeSegment === "all"}
            count={ongoingItems.length + upcomingItems.length + endedItems.length}
            onClick={() => setActiveSegment("all")}
          />
          <SegmentTab
            label="Live"
            active={activeSegment === "ongoing"}
            count={ongoingItems.length}
            pulse={true}
            onClick={() => setActiveSegment("ongoing")}
          />
          <SegmentTab
            label="Upcoming"
            active={activeSegment === "upcoming"}
            count={upcomingItems.length}
            onClick={() => setActiveSegment("upcoming")}
          />
          <SegmentTab
            label="Listed"
            active={activeSegment === "ended"}
            count={endedItems.length}
            onClick={() => setActiveSegment("ended")}
          />
        </div>
      </div>

      {/* IPO List */}
      <div className="relative mt-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {displayedItems.length > 0 ? (
            displayedItems.map((item, idx) => (
              <IpoCardRow key={item.id || item.ticker} item={item} index={idx} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
              No IPO listings found for this segment.
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-cyan-400 to-blue-500"
      />
    </motion.div>
  );
}

function SegmentTab({
  label,
  active,
  count,
  pulse = false,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  pulse?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
        active
          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
          active ? "bg-cyan-400/20 text-cyan-200" : "bg-white/10 text-slate-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function IpoCardRow({ item, index }: { item: IpoItem; index: number }) {
  const isLive = item.status === "ongoing";
  const isUpcoming = item.status === "upcoming";
  const isEnded = item.status === "ended";

  const priceRange =
    item.price_band_low && item.price_band_high
      ? `₹${item.price_band_low} - ₹${item.price_band_high}`
      : "TBA";

  const issueSizeStr = item.issue_size ? `₹${item.issue_size.toLocaleString("en-IN")} Cr` : "TBA";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: EASE }}
      whileHover={{ x: 4, transition: HOVER_SPRING }}
      className={`
        group/row relative overflow-hidden rounded-2xl border p-4 backdrop-blur-2xl transition-all duration-300
        ${
          isLive
            ? "border-emerald-500/30 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
            : isUpcoming
            ? "border-cyan-500/20 bg-white/[0.03] hover:bg-white/[0.07]"
            : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
        }
      `}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Ticker & Name & Sector */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold border ${
              isLive
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : isUpcoming
                ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                : "bg-purple-500/15 text-purple-400 border-purple-500/30"
            }`}
          >
            {item.ticker.slice(0, 4)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-base">{item.ticker}</span>
              <span className="text-xs text-slate-400 max-w-[200px] truncate">{item.name}</span>
              {item.sector && (
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                  {item.sector}
                </span>
              )}
            </div>

            {/* Description / Info */}
            <p className="mt-1 text-xs text-slate-400 line-clamp-1">
              {item.description || `Initial Public Offering on ${item.exchange}`}
            </p>
          </div>
        </div>

        {/* Right: Key Financials & Status */}
        <div className="flex items-center gap-6 justify-between sm:justify-end">
          {/* Price Band */}
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Price Band</div>
            <div className="text-xs font-bold text-white">{priceRange}</div>
          </div>

          {/* Issue Size */}
          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-slate-400">Issue Size</div>
            <div className="text-xs font-bold text-cyan-300">{issueSizeStr}</div>
          </div>

          {/* Listing Gain or Status Badge */}
          {isEnded && item.listing_gain_pct != null ? (
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Listing Gain</div>
              <div
                className={`inline-flex items-center gap-1 font-bold text-xs ${
                  item.listing_gain_pct >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {item.listing_gain_pct >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {item.listing_gain_pct >= 0 ? "+" : ""}
                {item.listing_gain_pct.toFixed(1)}%
              </div>
            </div>
          ) : (
            <div>
              <StatusBadge status={item.status} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: IPOStatus }) {
  if (status === "ongoing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Live Bidding
      </span>
    );
  }

  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-300">
        <Clock className="h-3.5 w-3.5 text-cyan-400" />
        Upcoming
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/15 px-3 py-1 text-xs font-bold text-purple-300">
      <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
      Listed
    </span>
  );
}

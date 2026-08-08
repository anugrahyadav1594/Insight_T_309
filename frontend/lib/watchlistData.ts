export type AISignal = "Bullish" | "Neutral" | "Bearish" | "Buy Zone" | "Accumulate";

export interface WatchlistStock {
  symbol: string;
  company: string;
  price: number;
  change: number;
  volume: "High" | "Normal" | "Low";
  aiSignal: AISignal;
  aiScore: number;
}

export const watchlist: WatchlistStock[] = [
  {
    symbol: "INFY",
    company: "Infosys Ltd",
    price: 1680,
    change: 2.1,
    volume: "High",
    aiSignal: "Bullish",
    aiScore: 88,
  },
  {
    symbol: "TCS",
    company: "Tata Consultancy Services",
    price: 3725,
    change: -0.8,
    volume: "Normal",
    aiSignal: "Neutral",
    aiScore: 62,
  },
  {
    symbol: "HDFCBANK",
    company: "HDFC Bank Ltd",
    price: 1690,
    change: 1.3,
    volume: "High",
    aiSignal: "Buy Zone",
    aiScore: 91,
  },
  {
    symbol: "RELIANCE",
    company: "Reliance Industries",
    price: 2510,
    change: 0.6,
    volume: "Normal",
    aiSignal: "Accumulate",
    aiScore: 84,
  },
  {
    symbol: "ICICIBANK",
    company: "ICICI Bank Ltd",
    price: 1055,
    change: -1.4,
    volume: "Low",
    aiSignal: "Bearish",
    aiScore: 38,
  },
  {
    symbol: "WIPRO",
    company: "Wipro Ltd",
    price: 398,
    change: -2.3,
    volume: "High",
    aiSignal: "Bearish",
    aiScore: 29,
  },
  {
    symbol: "SBIN",
    company: "State Bank of India",
    price: 625,
    change: 1.8,
    volume: "High",
    aiSignal: "Bullish",
    aiScore: 86,
  },
  {
    symbol: "BAJFINANCE",
    company: "Bajaj Finance Ltd",
    price: 7240,
    change: 0.4,
    volume: "Normal",
    aiSignal: "Neutral",
    aiScore: 55,
  },
  {
    symbol: "TATAMOTORS",
    company: "Tata Motors Ltd",
    price: 645,
    change: 3.2,
    volume: "High",
    aiSignal: "Bullish",
    aiScore: 92,
  },
  {
    symbol: "MARUTI",
    company: "Maruti Suzuki India",
    price: 11850,
    change: -0.3,
    volume: "Low",
    aiSignal: "Neutral",
    aiScore: 58,
  },
  {
    symbol: "SUNPHARMA",
    company: "Sun Pharmaceutical",
    price: 1125,
    change: 1.1,
    volume: "Normal",
    aiSignal: "Buy Zone",
    aiScore: 79,
  },
  {
    symbol: "AXISBANK",
    company: "Axis Bank Ltd",
    price: 1085,
    change: 0.9,
    volume: "Normal",
    aiSignal: "Accumulate",
    aiScore: 76,
  },
  {
    symbol: "LT",
    company: "Larsen & Toubro",
    price: 2780,
    change: -1.1,
    volume: "Low",
    aiSignal: "Bearish",
    aiScore: 41,
  },
  {
    symbol: "TITAN",
    company: "Titan Company Ltd",
    price: 3150,
    change: 2.5,
    volume: "High",
    aiSignal: "Bullish",
    aiScore: 87,
  },
  {
    symbol: "ASIANPAINT",
    company: "Asian Paints Ltd",
    price: 2940,
    change: -0.5,
    volume: "Normal",
    aiSignal: "Neutral",
    aiScore: 52,
  },
  {
    symbol: "ULTRACEMCO",
    company: "UltraTech Cement",
    price: 8650,
    change: 0.7,
    volume: "Low",
    aiSignal: "Accumulate",
    aiScore: 73,
  },
  {
    symbol: "NESTLEIND",
    company: "Nestle India Ltd",
    price: 22400,
    change: 0.2,
    volume: "Low",
    aiSignal: "Neutral",
    aiScore: 60,
  },
  {
    symbol: "BHARTIARTL",
    company: "Bharti Airtel Ltd",
    price: 1420,
    change: 1.6,
    volume: "High",
    aiSignal: "Bullish",
    aiScore: 89,
  },
];

// Derived stats for KPI cards
export function getWatchlistStats(stocks: WatchlistStock[]) {
  const bullish = stocks.filter(
    (s) => s.aiSignal === "Bullish" || s.aiSignal === "Buy Zone" || s.aiSignal === "Accumulate"
  ).length;
  const bearish = stocks.filter((s) => s.aiSignal === "Bearish").length;
  const alerts = stocks.filter((s) => Math.abs(s.change) >= 2).length;

  return {
    total: stocks.length,
    bullish,
    bearish,
    alerts,
  };
}

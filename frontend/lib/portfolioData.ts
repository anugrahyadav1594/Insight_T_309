export interface Holding {
  symbol: string;
  name: string;
  qty: number;
  avg: number;
  current: number;
  dayChange: number; // percentage change for the day
  weight: number; // percentage of portfolio
  fundScore: number;
  techScore: number;
  riskScore: number;
}

export interface PortfolioSummary {
  totalValue: number;
  todayPnL: number;
  totalReturn: number;
  riskScore: number;
  mixedScore: number;
  fundamentalScore: number;
  technicalScore: number;
}

export const portfolio: PortfolioSummary = {
  totalValue: 2487500,
  todayPnL: 15420,
  totalReturn: 18.7,
  riskScore: 52,
  mixedScore: 23.9,
  fundamentalScore: 50,
  technicalScore: 50,
};

export const holdings: Holding[] = [
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Ltd.",
    qty: 12,
    avg: 3480,
    current: 4064.51,
    dayChange: 1.99,
    weight: 22.2,
    fundScore: 22.4,
    techScore: 50,
    riskScore: 98,
  },
  {
    symbol: "INFY",
    name: "Infosys Ltd.",
    qty: 25,
    avg: 1420,
    current: 2272.55,
    dayChange: 0.09,
    weight: 29.8,
    fundScore: 19.5,
    techScore: 50,
    riskScore: 93.3,
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Ltd.",
    qty: 15,
    avg: 900,
    current: 1549.09,
    dayChange: -0.16,
    weight: 25.4,
    fundScore: 32.7,
    techScore: 50,
    riskScore: 97.9,
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd.",
    qty: 1,
    avg: 2600,
    current: 541.97,
    dayChange: 2.39,
    weight: 0.6,
    fundScore: 4.9,
    techScore: 50,
    riskScore: 83.8,
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd.",
    qty: 10,
    avg: 1500,
    current: 683.44,
    dayChange: 4.92,
    weight: 7.5,
    fundScore: 3.1,
    techScore: 50,
    riskScore: 83.6,
  },
  {
    symbol: "LT",
    name: "Larsen & Toubro Ltd.",
    qty: 7,
    avg: 3200,
    current: 1907.02,
    dayChange: 0.92,
    weight: 14.6,
    fundScore: 31.7,
    techScore: 50,
    riskScore: 80.5,
  },
];

// Helper to compute P&L for a holding
export function calcPnL(holding: Holding): { amount: number; percent: number } {
  const amount = (holding.current - holding.avg) * holding.qty;
  const percent = ((holding.current - holding.avg) / holding.avg) * 100;
  return { amount, percent };
}

// Get top contributors (highest positive return %)
export function getTopContributors(holdingsList: Holding[], count: number = 3): Holding[] {
  return [...holdingsList]
    .filter((h) => h.current > h.avg)
    .sort((a, b) => {
      const pA = ((a.current - a.avg) / a.avg) * 100;
      const pB = ((b.current - b.avg) / b.avg) * 100;
      return pB - pA;
    })
    .slice(0, count);
}

// Get bottom laggards (most negative return %)
export function getBottomLaggards(holdingsList: Holding[], count: number = 3): Holding[] {
  return [...holdingsList]
    .filter((h) => h.current < h.avg)
    .sort((a, b) => {
      const pA = ((a.current - a.avg) / a.avg) * 100;
      const pB = ((b.current - b.avg) / b.avg) * 100;
      return pA - pB;
    })
    .slice(0, count);
}
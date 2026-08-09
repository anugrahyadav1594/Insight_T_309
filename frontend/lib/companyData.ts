export interface CompanyAnalysisData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  marketCap: string;
  sector: string;
  chips: string[];
  recommendation: {
    verdict: "Strong Bullish" | "Bullish" | "Neutral" | "Bearish" | "Strong Bearish";
    score: number;
    confidence: string;
    summaryPoints: string[];
  };
  financials: {
    revenueGrowth: string;
    roe: string;
    epsGrowth: string;
    debtEquity: string;
  };
  analysis: {
    businessQuality: string;
    valuation: string;
    growth: string;
    management: string;
    moat: string;
  };
  risks: string[];
  opportunities: string[];
  news: {
    title: string;
    time: string;
    source: string;
  }[];
}

export const companyDataMap: Record<string, CompanyAnalysisData> = {
  TCS: {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    price: 3725,
    change: 1.8,
    marketCap: "Large Cap",
    sector: "IT Services",
    chips: ["Large Cap", "High Quality", "Dividend", "Low Debt"],
    recommendation: {
      verdict: "Strong Bullish",
      score: 92,
      confidence: "High Conviction",
      summaryPoints: [
        "Revenue growth remains stable across key geographies.",
        "Operating margins continue expanding due to operational efficiency.",
        "Management commentary remains positive on tech spending.",
        "Valuation is still attractive compared to historical multiples.",
        "Long-term outlook is highly favorable with strong order pipelines.",
      ],
    },
    financials: {
      revenueGrowth: "18%",
      roe: "27%",
      epsGrowth: "21%",
      debtEquity: "0.05",
    },
    analysis: {
      businessQuality: "Industry-leading return ratios (ROE/ROCE) and exceptional free cash flow generation. TCS is the gold standard of execution in Indian IT.",
      valuation: "Currently trading at 28x forward earnings, which is inline with its 5-year average and presents a reasonable entry point given growth rates.",
      growth: "Driven by multi-year cloud transformation deals, cybersecurity services expansion, and emerging AI adoption services.",
      management: "Proven leadership team with decades of experience within the Tata ecosystem, emphasizing stable governance and shareholder payouts.",
      moat: "High switching costs driven by deep integration into global enterprise architectures and an unmatched talent supply chain.",
    },
    risks: [
      "High North America & Europe revenue exposure makes it vulnerable to macro shifts.",
      "Rupee appreciation against USD could impact operating margins.",
      "Wage inflation and talent retention costs in high-end tech segments.",
    ],
    opportunities: [
      "Surging enterprise demand for generative AI pilots and scaled rollouts.",
      "Accelerated legacy cloud migration deals globally.",
      "Robust deal pipeline with mega-deal potential in BFSI & Retail sectors.",
    ],
    news: [
      { title: "Earnings Beat: TCS Q4 margins hit 26%, net profit jumps 9% YoY", time: "Today", source: "Moneycontrol", url: "https://www.moneycontrol.com/news/business/earnings/tcs-q4-results-margins-hit-26-net-profit-jumps-9-yoy-126234.html" },
      { title: "Broker Upgrade: Top research house lifts TCS target price to ₹4,200", time: "Yesterday", source: "Bloomberg", url: "https://www.bloomberg.com/markets/stocks" },
      { title: "New Deal: TCS signs multi-million dollar cloud transition deal with US retail giant", time: "3 days ago", source: "Mint", url: "https://www.livemint.com/market/stock-market-news" },
    ],
  },
  INFY: {
    symbol: "INFY",
    name: "Infosys Ltd",
    price: 1680,
    change: 2.1,
    marketCap: "Large Cap",
    sector: "IT Services",
    chips: ["Large Cap", "High Growth", "Strong Cashflow", "Low Debt"],
    recommendation: {
      verdict: "Bullish",
      score: 88,
      confidence: "Medium-High Conviction",
      summaryPoints: [
        "Digital transformation momentum continues to power revenue streams.",
        "Strong margins supported by automation platform conversions.",
        "Large deal bookings hit record levels this quarter.",
        "Healthy capital return policy via buybacks and dividends.",
      ],
    },
    financials: {
      revenueGrowth: "15%",
      roe: "29%",
      epsGrowth: "18%",
      debtEquity: "0.08",
    },
    analysis: {
      businessQuality: "Highly efficient business model with deep client relationships and industry-leading operating profit margins (OPM).",
      valuation: "Trading at 24x forward earnings, offering a slight discount compared to historical premium valuations.",
      growth: "Fostered by strong traction in enterprise generative AI platforms and cloud migration suites.",
      management: "Stable professional management guided by strong corporate governance frameworks.",
      moat: "Global delivery model, proprietary platform solutions (Finacle, EdgeVerve), and high customer stickiness.",
    },
    risks: [
      "Slowing discretionary tech spend in the BFSI sector.",
      "High employee turnover rate compared to peers.",
      "Geopolitical tensions disrupting international delivery pipelines.",
    ],
    opportunities: [
      "GenAI adoption scaling up across cloud optimization services.",
      "Market share gains in European enterprise accounts.",
      "Strategic partnerships with hyperscalers.",
    ],
    news: [
      { title: "Infosys launches Topaz, an AI-first suite of offerings", time: "2 days ago", source: "Economic Times", url: "https://economictimes.indiatimes.com/tech/information-tech/infosys-topaz-ai-suite" },
      { title: "Brokerage maintains Buy rating on INFY post Q4 results", time: "4 days ago", source: "CNBC TV18", url: "https://www.cnbctv18.com/market/stocks" },
    ],
  },
  HDFCBANK: {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    price: 1690,
    change: 1.3,
    marketCap: "Large Cap",
    sector: "Banking & Financials",
    chips: ["Large Cap", "High Quality", "Low NPA", "Strong Management"],
    recommendation: {
      verdict: "Strong Bullish",
      score: 91,
      confidence: "High Conviction",
      summaryPoints: [
        "Unrivalled credit quality with consistently low Net NPA ratios.",
        "Robust loan book expansion powered by retail credit demand.",
        "Post-merger synergy benefits starting to reflect in deposit growth.",
        "Stable net interest margins (NIM) under challenging macro setups.",
      ],
    },
    financials: {
      revenueGrowth: "20%",
      roe: "18%",
      epsGrowth: "19%",
      debtEquity: "N/A",
    },
    analysis: {
      businessQuality: "The largest private sector lender in India, showing unparalleled risk-managed growth over three decades.",
      valuation: "Trading at book value multiples near long-term averages, providing a margin of safety.",
      growth: "Expansion of physical branches in semi-urban areas and digitalization of retail products.",
      management: "Extremely stable leadership team with strong regulatory compliance credentials.",
      moat: "Low-cost CASA deposit base, massive distribution system, and dominant credit card position.",
    },
    risks: [
      "Slower deposit growth relative to rapid credit expansion.",
      "Compression in net interest margins due to competitive deposit rates.",
      "Regulatory changes impacting fee income lines.",
    ],
    opportunities: [
      "Cross-selling banking products to the vast housing loan customer base.",
      "Digital lending platforms increasing efficiency and margins.",
      "Sustained credit cycle upswing in India.",
    ],
    news: [
      { title: "HDFC Bank net profit beats estimates, rises 37% YoY", time: "Yesterday", source: "Financial Express", url: "https://www.financialexpress.com/market" },
      { title: "Deposits grow at record pace in Q4; stock jumps 3%", time: "3 days ago", source: "Mint", url: "https://www.livemint.com/companies/news" },
    ],
  },
  RELIANCE: {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    price: 2510,
    change: 0.6,
    marketCap: "Large Cap",
    sector: "Conglomerate",
    chips: ["Large Cap", "Market Leader", "High Capex", "Diversified"],
    recommendation: {
      verdict: "Bullish",
      score: 84,
      confidence: "Medium-High Conviction",
      summaryPoints: [
        "Jio retains dominant position in telecom with stable ARPU growth.",
        "Retail segment continues scale-up through physical store footprints.",
        "Traditional oil-to-chemicals (O2C) margins remain supportive.",
        "Major green energy expansion plans starting to take shape.",
      ],
    },
    financials: {
      revenueGrowth: "14%",
      roe: "12%",
      epsGrowth: "11%",
      debtEquity: "0.38",
    },
    analysis: {
      businessQuality: "Highly diversified consumer-facing conglomerate with leading positions across retail, telecom, and energy.",
      valuation: "Valued on sum-of-the-parts (SOTP) basis; retail and telecom valuations support current market price.",
      growth: "Growth driven by digital services (Jio Platforms) and expansion of retail categories.",
      management: "Strong entrepreneurial leadership with a track record of executing mega-scale projects.",
      moat: "Unmatched scale, integrated telecom-retail ecosystem, and deep capital resources.",
    },
    risks: [
      "High capital expenditure cycles pressure immediate free cash flows.",
      "Volatile global crude and refining margin environments.",
      "Intensifying competition in the retail and e-commerce spaces.",
    ],
    opportunities: [
      "Jio Financial Services integration and roll-out.",
      "Commercialization of gigafactories for green hydrogen and solar energy.",
      "Monetization of retail assets via REITs or IPOs.",
    ],
    news: [
      { title: "Reliance Retail acquires rights for global fashion brand", time: "Today", source: "Business Standard", url: "https://www.business-standard.com/company/reliance-ind-500325" },
      { title: "Jio introduces new AI-powered cloud storage service plans", time: "5 days ago", source: "Economic Times", url: "https://economictimes.indiatimes.com/industry/telecom/telecom-news" },
    ],
  },
};

import { screenerStocks } from "./screenerData";

export function getCompanyInfo(ticker: string): CompanyAnalysisData {
  const symbolUpper = (ticker || "RELIANCE").toUpperCase();
  if (companyDataMap[symbolUpper]) {
    return companyDataMap[symbolUpper];
  }

  const screenerMatch = screenerStocks.find((s) => s.symbol.toUpperCase() === symbolUpper);

  let hash = 0;
  for (let i = 0; i < symbolUpper.length; i++) {
    hash = (hash << 5) - hash + symbolUpper.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const price = screenerMatch?.price || (200 + (positiveHash % 3500));
  const change = screenerMatch
    ? (positiveHash % 2 === 0 ? 1.5 : -1.2)
    : Math.round(((positiveHash % 500) / 100 - 2.5) * 100) / 100;
  const sector = screenerMatch?.sector || (["Technology", "Banking & Financials", "Automotive", "Consumer Goods", "Energy", "Healthcare"][positiveHash % 6]);
  const name = screenerMatch?.name || `${symbolUpper} India Ltd`;
  const pe = screenerMatch?.pe || (12 + (positiveHash % 40));
  const roe = screenerMatch?.roe || (10 + (positiveHash % 25));
  const revenueGrowth = screenerMatch?.revenueGrowth || (8 + (positiveHash % 22));
  const debtEquity = screenerMatch?.debtEquity || (positiveHash % 100) / 100;

  return {
    symbol: symbolUpper,
    name,
    price,
    change,
    marketCap: price > 1500 ? "Large Cap" : price > 500 ? "Mid Cap" : "Small Cap",
    sector,
    chips: [
      price > 1500 ? "Large Cap" : "Mid Cap",
      roe > 18 ? "High Quality" : "Growth",
      debtEquity < 0.3 ? "Low Debt" : "Leveraged",
      pe < 25 ? "Value" : "High Growth",
    ],
    recommendation: {
      verdict: pe < 20 && roe > 18 ? "Strong Bullish" : pe < 30 ? "Bullish" : "Neutral",
      score: 65 + (positiveHash % 30),
      confidence: "High Conviction",
      summaryPoints: [
        `Revenue growth remains healthy at ${revenueGrowth}% YoY in ${sector}.`,
        `Return on Equity (ROE) stands strong at ${roe}%.`,
        `Valuation P/E multiple of ${pe}x is reasonable relative to peer group.`,
        `Balance sheet shows debt-to-equity ratio of ${debtEquity}.`,
        `Positive long-term structural tailwinds supporting earnings outlook.`,
      ],
    },
    financials: {
      revenueGrowth: `${revenueGrowth}%`,
      roe: `${roe}%`,
      epsGrowth: `${Math.round(revenueGrowth * 1.1)}%`,
      debtEquity: `${debtEquity}`,
    },
    analysis: {
      businessQuality: `${name} operates a strong model in ${sector} with consistent cash flow generation and healthy return metrics.`,
      valuation: `Currently trading at ${pe}x trailing earnings, presenting a fair risk-reward entry profile.`,
      growth: `Top-line momentum supported by expanding market presence and operating leverage in ${sector}.`,
      management: `Seasoned executive leadership focused on disciplined capital allocation and operational execution.`,
      moat: `Protected by strong brand recognition, scale advantages, and high switching costs in its market.`,
    },
    risks: [
      `Macroeconomic volatility impacting demand patterns in ${sector}.`,
      `Raw material cost pressures or currency fluctuations.`,
      `Intense competitive pricing from domestic and global peers.`,
    ],
    opportunities: [
      `Expansion into new high-margin product verticals and geographic regions.`,
      `Digital automation initiatives boosting operating margins.`,
      `Strong industry tailwinds driving organic market share gains.`,
    ],
    news: [
      { title: `${name} reports quarterly performance update with expanded margins`, time: "Today", source: "Moneycontrol", url: `https://www.google.com/search?q=${encodeURIComponent(name + " news")}` },
      { title: `Leading research firm issues analyst rating on ${symbolUpper}`, time: "Yesterday", source: "Bloomberg", url: `https://www.google.com/search?q=${encodeURIComponent(symbolUpper + " stock news")}` },
      { title: `${symbolUpper} announces expansion plans in key domestic markets`, time: "2 days ago", source: "Mint", url: `https://www.google.com/search?q=${encodeURIComponent(symbolUpper + " expansion mint")}` },
    ],
  };
}

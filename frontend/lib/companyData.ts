export interface CompanyAnalysisData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  marketCap: string;
  sector: string;
  chips: string[];
  recommendation: {
    verdict: "Strong Buy" | "Buy" | "Hold" | "Sell";
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
      verdict: "Strong Buy",
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
      { title: "Earnings Beat: TCS Q4 margins hit 26%, net profit jumps 9% YoY", time: "Today", source: "Moneycontrol" },
      { title: "Broker Upgrade: Top research house lifts TCS target price to ₹4,200", time: "Yesterday", source: "Bloomberg" },
      { title: "New Deal: TCS signs multi-million dollar cloud transition deal with US retail giant", time: "3 days ago", source: "Mint" },
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
      verdict: "Buy",
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
      { title: "Infosys launches Topaz, an AI-first suite of offerings", time: "2 days ago", source: "Economic Times" },
      { title: "Brokerage maintains Buy rating on INFY post Q4 results", time: "4 days ago", source: "CNBC TV18" },
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
      verdict: "Strong Buy",
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
      { title: "HDFC Bank net profit beats estimates, rises 37% YoY", time: "Yesterday", source: "Financial Express" },
      { title: "Deposits grow at record pace in Q4; stock jumps 3%", time: "3 days ago", source: "Mint" },
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
      verdict: "Buy",
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
      { title: "Reliance Retail acquires rights for global fashion brand", time: "Today", source: "Business Standard" },
      { title: "Jio introduces new AI-powered cloud storage service plans", time: "5 days ago", source: "Economic Times" },
    ],
  },
};

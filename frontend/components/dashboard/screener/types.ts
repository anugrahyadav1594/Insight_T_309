export type OperatorType = ">" | "<" | "=" | ">=" | "<=";

export interface FilterMetric {
  id: string;
  name: string;
  category: "AI Metrics" | "Financial" | "Valuation" | "Technical" | "Growth" | "Risk";
  type: "number" | "string";
  placeholder?: string;
  defaultValue?: string | number;
}

export interface Filter {
  id: string; // unique random id
  metricId: string; // points to FilterMetric id
  operator: OperatorType;
  value: string | number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  filters: Omit<Filter, "id">[];
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  marketCap: "Large Cap" | "Mid Cap" | "Small Cap";
  price: number;
  revenueGrowth: number;
  epsGrowth: number;
  roe: number;
  pe: number;
  debtEquity: number;
  aiScore: number;
  recommendation: "Strong Buy" | "Buy" | "Hold" | "Avoid";
}

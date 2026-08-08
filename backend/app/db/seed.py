"""Database seeding — bundled Indian companies + metric snapshots (§4.16, §27).

Guarantees the demo works fully offline. Every seeded company gets a metrics
snapshot, synthetic (deterministic) price history and statements so the
technical/risk engines produce meaningful, varied scores. All rows are marked
``source='seed'`` / ``data_status='seeded'``.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.engines.fundamental_engine import compute_fundamental
from app.engines.technical_engine import compute_technical
from app.engines.risk_engine import compute_risk
from app.engines.overall_engine import compute_overall
from app.engines.metrics_engine import build_calculated_metrics, compute_price_metrics
from app.models.company import CompanyPrice, FinancialStatement
from app.models.portfolio import Portfolio
from app.models.watchlist import Watchlist

logger = logging.getLogger("insight.seed")

# ---------------------------------------------------------------------------
# Indian company dataset (ticker, name, exchange, sector, industry, price, market_cap, metrics)
# ---------------------------------------------------------------------------
# Each entry: ticker, name, sector, industry, price, market_cap, metrics dict overrides.
_COMPANIES: list[tuple[str, str, str, str, float, float, dict]] = [
    ("TCS", "Tata Consultancy Services", "Technology", "IT Services", 3725, 1.35e12,
     {"roe": 27.4, "net_margin": 21.0, "operating_margin": 25.1, "gross_margin": 46.2,
      "current_ratio": 2.4, "debt_to_equity": 0.09, "pe": 24.5, "revenue_growth": 8.9,
      "eps_growth": 12.1, "beta": 0.9, "dividend_yield": 1.4, "fcf_yield": 3.0}),
    ("INFY", "Infosys", "Technology", "IT Services", 1480, 6.1e11,
     {"roe": 30.1, "net_margin": 22.5, "operating_margin": 26.0, "gross_margin": 47.0,
      "current_ratio": 2.6, "debt_to_equity": 0.05, "pe": 26.0, "revenue_growth": 9.5,
      "eps_growth": 10.2, "beta": 0.85, "dividend_yield": 2.1, "fcf_yield": 3.4}),
    ("RELIANCE", "Reliance Industries", "Energy", "Conglomerates", 2920, 1.98e12,
     {"roe": 9.8, "net_margin": 8.4, "operating_margin": 14.0, "gross_margin": 32.0,
      "current_ratio": 1.1, "debt_to_equity": 0.6, "pe": 24.0, "revenue_growth": 7.0,
      "eps_growth": 8.0, "beta": 1.1, "dividend_yield": 0.4, "fcf_yield": 1.5}),
    ("HDFCBANK", "HDFC Bank", "Financials", "Banking", 1650, 9.2e11,
     {"roe": 16.5, "net_margin": 24.0, "operating_margin": 46.0, "gross_margin": 100.0,
      "current_ratio": 1.0, "debt_to_equity": 5.0, "pe": 18.5, "revenue_growth": 14.0,
      "eps_growth": 15.5, "beta": 0.95, "dividend_yield": 1.1, "fcf_yield": 0.5}),
    ("TATAMOTORS", "Tata Motors", "Consumer Discretionary", "Automobiles", 980, 3.6e11,
     {"roe": 18.0, "net_margin": 6.0, "operating_margin": 12.0, "gross_margin": 30.0,
      "current_ratio": 1.1, "debt_to_equity": 0.8, "pe": 15.0, "revenue_growth": 11.0,
      "eps_growth": 20.0, "beta": 1.2, "dividend_yield": 0.3, "fcf_yield": 2.5}),
    ("ITC", "ITC", "Consumer Staples", "FMCG", 420, 5.2e11,
     {"roe": 30.0, "net_margin": 28.0, "operating_margin": 34.0, "gross_margin": 45.0,
      "current_ratio": 2.2, "debt_to_equity": 0.01, "pe": 25.0, "revenue_growth": 6.0,
      "eps_growth": 7.5, "beta": 0.6, "dividend_yield": 3.4, "fcf_yield": 4.0}),
    ("SBIN", "State Bank of India", "Financials", "Banking", 780, 7.0e11,
     {"roe": 15.0, "net_margin": 12.0, "operating_margin": 28.0, "gross_margin": 100.0,
      "current_ratio": 1.0, "debt_to_equity": 8.0, "pe": 9.5, "revenue_growth": 12.0,
      "eps_growth": 18.0, "beta": 1.1, "dividend_yield": 1.6, "fcf_yield": 0.3}),
    ("LT", "Larsen & Toubro", "Industrials", "Engineering", 3580, 5.0e11,
     {"roe": 16.0, "net_margin": 8.5, "operating_margin": 12.5, "gross_margin": 28.0,
      "current_ratio": 1.3, "debt_to_equity": 0.4, "pe": 30.0, "revenue_growth": 13.0,
      "eps_growth": 16.0, "beta": 1.0, "dividend_yield": 0.8, "fcf_yield": 1.8}),
    ("HINDUNILVR", "Hindustan Unilever", "Consumer Staples", "FMCG", 2460, 5.8e11,
     {"roe": 22.0, "net_margin": 17.0, "operating_margin": 23.0, "gross_margin": 48.0,
      "current_ratio": 1.5, "debt_to_equity": 0.1, "pe": 55.0, "revenue_growth": 4.0,
      "eps_growth": 6.0, "beta": 0.6, "dividend_yield": 1.8, "fcf_yield": 2.2}),
    ("BHARTIARTL", "Bharti Airtel", "Communication", "Telecom", 1550, 8.8e11,
     {"roe": 15.0, "net_margin": 12.0, "operating_margin": 40.0, "gross_margin": 55.0,
      "current_ratio": 0.8, "debt_to_equity": 1.2, "pe": 22.0, "revenue_growth": 15.0,
      "eps_growth": 25.0, "beta": 1.0, "dividend_yield": 0.5, "fcf_yield": 3.5}),
    ("WIPRO", "Wipro", "Technology", "IT Services", 500, 2.6e11,
     {"roe": 17.0, "net_margin": 15.0, "operating_margin": 17.0, "gross_margin": 33.0,
      "current_ratio": 2.0, "debt_to_equity": 0.2, "pe": 21.0, "revenue_growth": 6.5,
      "eps_growth": 8.0, "beta": 0.9, "dividend_yield": 0.6, "fcf_yield": 2.8}),
    ("HCLTECH", "HCL Technologies", "Technology", "IT Services", 1500, 4.1e11,
     {"roe": 22.0, "net_margin": 17.5, "operating_margin": 22.0, "gross_margin": 42.0,
      "current_ratio": 1.9, "debt_to_equity": 0.15, "pe": 24.0, "revenue_growth": 8.0,
      "eps_growth": 11.0, "beta": 0.85, "dividend_yield": 3.0, "fcf_yield": 4.0}),
    ("ICICIBANK", "ICICI Bank", "Financials", "Banking", 1080, 7.6e11,
     {"roe": 17.0, "net_margin": 22.0, "operating_margin": 42.0, "gross_margin": 100.0,
      "current_ratio": 1.0, "debt_to_equity": 6.0, "pe": 18.0, "revenue_growth": 15.0,
      "eps_growth": 17.0, "beta": 1.05, "dividend_yield": 0.8, "fcf_yield": 0.4}),
    ("KOTAKBANK", "Kotak Mahindra Bank", "Financials", "Banking", 1800, 3.6e11,
     {"roe": 14.5, "net_margin": 26.0, "operating_margin": 45.0, "gross_margin": 100.0,
      "current_ratio": 1.0, "debt_to_equity": 4.0, "pe": 20.0, "revenue_growth": 13.0,
      "eps_growth": 15.0, "beta": 1.0, "dividend_yield": 0.2, "fcf_yield": 0.3}),
    ("AXISBANK", "Axis Bank", "Financials", "Banking", 1120, 3.5e11,
     {"roe": 14.0, "net_margin": 18.0, "operating_margin": 36.0, "gross_margin": 100.0,
      "current_ratio": 1.0, "debt_to_equity": 7.0, "pe": 14.0, "revenue_growth": 16.0,
      "eps_growth": 20.0, "beta": 1.15, "dividend_yield": 0.1, "fcf_yield": 0.2}),
    ("MARUTI", "Maruti Suzuki India", "Consumer Discretionary", "Automobiles", 11500, 3.6e11,
     {"roe": 17.0, "net_margin": 7.5, "operating_margin": 11.0, "gross_margin": 28.0,
      "current_ratio": 1.3, "debt_to_equity": 0.0, "pe": 28.0, "revenue_growth": 12.0,
      "eps_growth": 14.0, "beta": 0.8, "dividend_yield": 0.7, "fcf_yield": 2.0}),
    ("TITAN", "Titan Company", "Consumer Discretionary", "Retail", 3400, 3.0e11,
     {"roe": 22.0, "net_margin": 8.5, "operating_margin": 11.0, "gross_margin": 26.0,
      "current_ratio": 1.5, "debt_to_equity": 0.1, "pe": 85.0, "revenue_growth": 18.0,
      "eps_growth": 20.0, "beta": 0.9, "dividend_yield": 0.1, "fcf_yield": 1.0}),
    ("SUNPHARMA", "Sun Pharmaceutical", "Healthcare", "Pharmaceuticals", 1500, 3.6e11,
     {"roe": 18.0, "net_margin": 15.0, "operating_margin": 22.0, "gross_margin": 68.0,
      "current_ratio": 2.0, "debt_to_equity": 0.05, "pe": 34.0, "revenue_growth": 12.0,
      "eps_growth": 14.0, "beta": 0.7, "dividend_yield": 0.8, "fcf_yield": 2.5}),
    ("CIPLA", "Cipla", "Healthcare", "Pharmaceuticals", 1450, 1.2e11,
     {"roe": 17.0, "net_margin": 14.0, "operating_margin": 20.0, "gross_margin": 60.0,
      "current_ratio": 1.8, "debt_to_equity": 0.1, "pe": 24.0, "revenue_growth": 10.0,
      "eps_growth": 13.0, "beta": 0.75, "dividend_yield": 0.9, "fcf_yield": 3.0}),
    ("DRREDDY", "Dr. Reddy's Laboratories", "Healthcare", "Pharmaceuticals", 6200, 1.0e11,
     {"roe": 20.0, "net_margin": 16.0, "operating_margin": 22.0, "gross_margin": 62.0,
      "current_ratio": 2.2, "debt_to_equity": 0.08, "pe": 22.0, "revenue_growth": 8.0,
      "eps_growth": 10.0, "beta": 0.7, "dividend_yield": 1.4, "fcf_yield": 4.0}),
    ("ASIANPAINT", "Asian Paints", "Consumer Discretionary", "Paints", 2800, 2.7e11,
     {"roe": 25.0, "net_margin": 14.0, "operating_margin": 19.0, "gross_margin": 42.0,
      "current_ratio": 1.6, "debt_to_equity": 0.1, "pe": 55.0, "revenue_growth": 7.0,
      "eps_growth": 8.0, "beta": 0.7, "dividend_yield": 0.9, "fcf_yield": 2.0}),
    ("BAJFINANCE", "Bajaj Finance", "Financials", "Consumer Finance", 7200, 4.4e11,
     {"roe": 20.0, "net_margin": 30.0, "operating_margin": 38.0, "gross_margin": 100.0,
      "current_ratio": 1.0, "debt_to_equity": 3.0, "pe": 30.0, "revenue_growth": 25.0,
      "eps_growth": 28.0, "beta": 1.1, "dividend_yield": 0.2, "fcf_yield": 0.5}),
    ("NESTLEIND", "Nestle India", "Consumer Staples", "FMCG", 2450, 2.4e11,
     {"roe": 30.0, "net_margin": 15.0, "operating_margin": 22.0, "gross_margin": 46.0,
      "current_ratio": 1.6, "debt_to_equity": 0.1, "pe": 65.0, "revenue_growth": 6.0,
      "eps_growth": 7.0, "beta": 0.6, "dividend_yield": 1.4, "fcf_yield": 2.2}),
    ("ULTRACEMCO", "UltraTech Cement", "Materials", "Cement", 10500, 3.0e11,
     {"roe": 13.0, "net_margin": 9.0, "operating_margin": 16.0, "gross_margin": 35.0,
      "current_ratio": 1.2, "debt_to_equity": 0.4, "pe": 42.0, "revenue_growth": 10.0,
      "eps_growth": 12.0, "beta": 1.0, "dividend_yield": 0.5, "fcf_yield": 1.5}),
    ("ADANIENT", "Adani Enterprises", "Industrials", "Conglomerates", 2900, 3.3e11,
     {"roe": 10.0, "net_margin": 3.5, "operating_margin": 6.0, "gross_margin": 12.0,
      "current_ratio": 1.1, "debt_to_equity": 1.6, "pe": 40.0, "revenue_growth": 20.0,
      "eps_growth": 25.0, "beta": 1.5, "dividend_yield": 0.1, "fcf_yield": 0.8}),
    ("ADANIPORTS", "Adani Ports and SEZ", "Industrials", "Infrastructure", 1300, 2.8e11,
     {"roe": 15.0, "net_margin": 30.0, "operating_margin": 50.0, "gross_margin": 55.0,
      "current_ratio": 1.3, "debt_to_equity": 1.2, "pe": 30.0, "revenue_growth": 15.0,
      "eps_growth": 18.0, "beta": 1.3, "dividend_yield": 0.5, "fcf_yield": 3.0}),
    ("TECHM", "Tech Mahindra", "Technology", "IT Services", 1550, 1.5e11,
     {"roe": 16.0, "net_margin": 9.0, "operating_margin": 14.0, "gross_margin": 30.0,
      "current_ratio": 2.0, "debt_to_equity": 0.1, "pe": 20.0, "revenue_growth": 5.0,
      "eps_growth": 7.0, "beta": 0.9, "dividend_yield": 2.2, "fcf_yield": 3.5}),
    ("LTIM", "LTIMindtree", "Technology", "IT Services", 5900, 1.7e11,
     {"roe": 24.0, "net_margin": 14.0, "operating_margin": 18.0, "gross_margin": 36.0,
      "current_ratio": 2.3, "debt_to_equity": 0.02, "pe": 32.0, "revenue_growth": 12.0,
      "eps_growth": 15.0, "beta": 0.9, "dividend_yield": 1.5, "fcf_yield": 3.0}),
    ("GRASIM", "Grasim Industries", "Materials", "Cement & Textiles", 2500, 1.7e11,
     {"roe": 9.0, "net_margin": 5.0, "operating_margin": 12.0, "gross_margin": 30.0,
      "current_ratio": 1.1, "debt_to_equity": 0.9, "pe": 26.0, "revenue_growth": 9.0,
      "eps_growth": 10.0, "beta": 1.1, "dividend_yield": 0.6, "fcf_yield": 1.2}),
    ("BAJAJFINSV", "Bajaj Finserv", "Financials", "Financial Services", 1600, 2.5e11,
     {"roe": 14.0, "net_margin": 18.0, "operating_margin": 22.0, "gross_margin": 100.0,
      "current_ratio": 1.0, "debt_to_equity": 2.0, "pe": 28.0, "revenue_growth": 22.0,
      "eps_growth": 24.0, "beta": 1.2, "dividend_yield": 0.1, "fcf_yield": 0.4}),
    ("TATASTEEL", "Tata Steel", "Materials", "Steel", 140, 1.7e11,
     {"roe": 11.0, "net_margin": 5.0, "operating_margin": 12.0, "gross_margin": 22.0,
      "current_ratio": 1.0, "debt_to_equity": 0.9, "pe": 14.0, "revenue_growth": 6.0,
      "eps_growth": 9.0, "beta": 1.3, "dividend_yield": 2.0, "fcf_yield": 3.0}),
    ("JSWSTEEL", "JSW Steel", "Materials", "Steel", 950, 2.3e11,
     {"roe": 14.0, "net_margin": 7.0, "operating_margin": 15.0, "gross_margin": 25.0,
      "current_ratio": 1.1, "debt_to_equity": 1.1, "pe": 20.0, "revenue_growth": 8.0,
      "eps_growth": 10.0, "beta": 1.3, "dividend_yield": 1.0, "fcf_yield": 2.5}),
    ("ONGC", "Oil and Natural Gas Corporation", "Energy", "Oil & Gas", 280, 3.5e11,
     {"roe": 13.0, "net_margin": 18.0, "operating_margin": 28.0, "gross_margin": 45.0,
      "current_ratio": 1.4, "debt_to_equity": 0.3, "pe": 7.0, "revenue_growth": -4.0,
      "eps_growth": 6.0, "beta": 1.0, "dividend_yield": 4.5, "fcf_yield": 6.0}),
    ("COALINDIA", "Coal India", "Energy", "Mining", 480, 2.9e11,
     {"roe": 45.0, "net_margin": 16.0, "operating_margin": 28.0, "gross_margin": 35.0,
      "current_ratio": 2.0, "debt_to_equity": 0.05, "pe": 7.5, "revenue_growth": 3.0,
      "eps_growth": 12.0, "beta": 0.9, "dividend_yield": 4.0, "fcf_yield": 8.0}),
    ("POWERGRID", "Power Grid Corporation", "Utilities", "Power", 320, 3.0e11,
     {"roe": 17.0, "net_margin": 24.0, "operating_margin": 48.0, "gross_margin": 60.0,
      "current_ratio": 1.2, "debt_to_equity": 1.5, "pe": 14.0, "revenue_growth": 8.0,
      "eps_growth": 10.0, "beta": 0.8, "dividend_yield": 3.5, "fcf_yield": 5.0}),
    ("NTPC", "NTPC", "Utilities", "Power", 360, 3.5e11,
     {"roe": 12.0, "net_margin": 14.0, "operating_margin": 30.0, "gross_margin": 40.0,
      "current_ratio": 1.1, "debt_to_equity": 1.5, "pe": 12.0, "revenue_growth": 6.0,
      "eps_growth": 8.0, "beta": 0.8, "dividend_yield": 3.2, "fcf_yield": 4.0}),
    ("TATAPOWER", "Tata Power", "Utilities", "Power", 400, 1.3e11,
     {"roe": 12.0, "net_margin": 8.0, "operating_margin": 18.0, "gross_margin": 30.0,
      "current_ratio": 1.0, "debt_to_equity": 1.3, "pe": 22.0, "revenue_growth": 15.0,
      "eps_growth": 18.0, "beta": 1.2, "dividend_yield": 0.9, "fcf_yield": 2.0}),
    ("BRITANNIA", "Britannia Industries", "Consumer Staples", "FMCG", 5100, 1.2e11,
     {"roe": 30.0, "net_margin": 13.0, "operating_margin": 17.0, "gross_margin": 36.0,
      "current_ratio": 1.4, "debt_to_equity": 0.2, "pe": 52.0, "revenue_growth": 6.0,
      "eps_growth": 8.0, "beta": 0.6, "dividend_yield": 1.4, "fcf_yield": 3.0}),
    ("DABUR", "Dabur India", "Consumer Staples", "FMCG", 540, 9.6e10,
     {"roe": 25.0, "net_margin": 15.0, "operating_margin": 19.0, "gross_margin": 45.0,
      "current_ratio": 2.0, "debt_to_equity": 0.05, "pe": 48.0, "revenue_growth": 5.0,
      "eps_growth": 7.0, "beta": 0.6, "dividend_yield": 1.8, "fcf_yield": 3.5}),
    ("MARICO", "Marico", "Consumer Staples", "FMCG", 520, 6.7e10,
     {"roe": 28.0, "net_margin": 13.0, "operating_margin": 18.0, "gross_margin": 40.0,
      "current_ratio": 2.1, "debt_to_equity": 0.1, "pe": 42.0, "revenue_growth": 6.0,
      "eps_growth": 8.0, "beta": 0.6, "dividend_yield": 1.5, "fcf_yield": 3.2}),
    ("GODREJCP", "Godrej Consumer Products", "Consumer Staples", "FMCG", 1200, 1.2e11,
     {"roe": 22.0, "net_margin": 13.0, "operating_margin": 18.0, "gross_margin": 42.0,
      "current_ratio": 1.7, "debt_to_equity": 0.2, "pe": 40.0, "revenue_growth": 7.0,
      "eps_growth": 9.0, "beta": 0.7, "dividend_yield": 1.3, "fcf_yield": 2.8}),
    ("VEDL", "Vedanta", "Materials", "Mining & Metals", 440, 1.6e11,
     {"roe": 20.0, "net_margin": 18.0, "operating_margin": 32.0, "gross_margin": 40.0,
      "current_ratio": 1.0, "debt_to_equity": 1.5, "pe": 8.0, "revenue_growth": 5.0,
      "eps_growth": 20.0, "beta": 1.5, "dividend_yield": 3.0, "fcf_yield": 6.0}),
    ("HINDALCO", "Hindalco Industries", "Materials", "Aluminium", 650, 1.5e11,
     {"roe": 12.0, "net_margin": 6.0, "operating_margin": 12.0, "gross_margin": 20.0,
      "current_ratio": 1.1, "debt_to_equity": 0.8, "pe": 12.0, "revenue_growth": 4.0,
      "eps_growth": 9.0, "beta": 1.4, "dividend_yield": 0.8, "fcf_yield": 3.0}),
    ("EICHERMOT", "Eicher Motors", "Consumer Discretionary", "Automobiles", 4800, 1.3e11,
     {"roe": 28.0, "net_margin": 15.0, "operating_margin": 21.0, "gross_margin": 35.0,
      "current_ratio": 1.6, "debt_to_equity": 0.0, "pe": 34.0, "revenue_growth": 9.0,
      "eps_growth": 11.0, "beta": 0.9, "dividend_yield": 1.8, "fcf_yield": 4.0}),
    ("BAJAJ-AUTO", "Bajaj Auto", "Consumer Discretionary", "Automobiles", 9500, 2.7e11,
     {"roe": 28.0, "net_margin": 17.0, "operating_margin": 20.0, "gross_margin": 34.0,
      "current_ratio": 1.6, "debt_to_equity": 0.0, "pe": 36.0, "revenue_growth": 14.0,
      "eps_growth": 18.0, "beta": 0.9, "dividend_yield": 1.2, "fcf_yield": 4.5}),
    ("HEROMOTOCO", "Hero MotoCorp", "Consumer Discretionary", "Automobiles", 4800, 9.6e10,
     {"roe": 25.0, "net_margin": 11.0, "operating_margin": 14.0, "gross_margin": 28.0,
      "current_ratio": 1.5, "debt_to_equity": 0.0, "pe": 25.0, "revenue_growth": 8.0,
      "eps_growth": 10.0, "beta": 0.9, "dividend_yield": 2.2, "fcf_yield": 5.0}),
    ("COLPAL", "Colgate-Palmolive India", "Consumer Staples", "FMCG", 2700, 7.3e10,
     {"roe": 55.0, "net_margin": 20.0, "operating_margin": 27.0, "gross_margin": 66.0,
      "current_ratio": 1.9, "debt_to_equity": 0.01, "pe": 45.0, "revenue_growth": 6.0,
      "eps_growth": 8.0, "beta": 0.5, "dividend_yield": 1.6, "fcf_yield": 4.0}),
    ("AMBUJACEM", "Ambuja Cements", "Materials", "Cement", 620, 1.2e11,
     {"roe": 10.0, "net_margin": 12.0, "operating_margin": 20.0, "gross_margin": 35.0,
      "current_ratio": 1.5, "debt_to_equity": 0.1, "pe": 32.0, "revenue_growth": 9.0,
      "eps_growth": 11.0, "beta": 1.0, "dividend_yield": 1.0, "fcf_yield": 2.5}),
    ("SBILIFE", "SBI Life Insurance", "Financials", "Insurance", 1500, 1.5e11,
     {"roe": 15.0, "net_margin": 8.0, "operating_margin": 10.0, "gross_margin": 30.0,
      "current_ratio": 1.5, "debt_to_equity": 0.1, "pe": 20.0, "revenue_growth": 12.0,
      "eps_growth": 15.0, "beta": 0.9, "dividend_yield": 0.3, "fcf_yield": 1.0}),
    ("HDFCLIFE", "HDFC Life Insurance", "Financials", "Insurance", 620, 1.3e11,
     {"roe": 12.0, "net_margin": 9.0, "operating_margin": 12.0, "gross_margin": 30.0,
      "current_ratio": 1.5, "debt_to_equity": 0.1, "pe": 18.0, "revenue_growth": 10.0,
      "eps_growth": 13.0, "beta": 0.9, "dividend_yield": 0.2, "fcf_yield": 0.8}),
    ("TATACONSUM", "Tata Consumer Products", "Consumer Staples", "FMCG", 1100, 1.1e11,
     {"roe": 12.0, "net_margin": 8.0, "operating_margin": 13.0, "gross_margin": 35.0,
      "current_ratio": 1.8, "debt_to_equity": 0.1, "pe": 55.0, "revenue_growth": 9.0,
      "eps_growth": 10.0, "beta": 0.6, "dividend_yield": 1.0, "fcf_yield": 2.0}),
    ("DLF", "DLF", "Real Estate", "Realty", 820, 2.0e11,
     {"roe": 8.0, "net_margin": 22.0, "operating_margin": 30.0, "gross_margin": 45.0,
      "current_ratio": 1.2, "debt_to_equity": 0.2, "pe": 45.0, "revenue_growth": 15.0,
      "eps_growth": 18.0, "beta": 1.2, "dividend_yield": 0.3, "fcf_yield": 3.0}),
    ("IRCTC", "Indian Railway Catering", "Consumer Discretionary", "Travel", 980, 7.8e10,
     {"roe": 50.0, "net_margin": 40.0, "operating_margin": 48.0, "gross_margin": 60.0,
      "current_ratio": 2.5, "debt_to_equity": 0.0, "pe": 32.0, "revenue_growth": 12.0,
      "eps_growth": 15.0, "beta": 0.9, "dividend_yield": 0.7, "fcf_yield": 5.0}),
    ("PAGEIND", "Page Industries", "Consumer Discretionary", "Apparel", 39000, 4.3e10,
     {"roe": 30.0, "net_margin": 16.0, "operating_margin": 20.0, "gross_margin": 54.0,
      "current_ratio": 1.7, "debt_to_equity": 0.1, "pe": 65.0, "revenue_growth": 12.0,
      "eps_growth": 14.0, "beta": 0.8, "dividend_yield": 0.7, "fcf_yield": 3.0}),
    ("BERGEPAINT", "Berger Paints", "Consumer Discretionary", "Paints", 520, 6.0e10,
     {"roe": 22.0, "net_margin": 11.0, "operating_margin": 16.0, "gross_margin": 40.0,
      "current_ratio": 1.4, "debt_to_equity": 0.1, "pe": 48.0, "revenue_growth": 8.0,
      "eps_growth": 10.0, "beta": 0.7, "dividend_yield": 0.7, "fcf_yield": 2.0}),
    ("MUTHOOTFIN", "Muthoot Finance", "Financials", "NBFC", 1600, 6.4e10,
     {"roe": 18.0, "net_margin": 18.0, "operating_margin": 30.0, "gross_margin": 100.0,
      "current_ratio": 1.0, "debt_to_equity": 3.0, "pe": 16.0, "revenue_growth": 15.0,
      "eps_growth": 17.0, "beta": 1.2, "dividend_yield": 0.7, "fcf_yield": 0.6}),
    ("INDIGO", "InterGlobe Aviation", "Industrials", "Airlines", 4300, 1.6e11,
     {"roe": 15.0, "net_margin": 6.0, "operating_margin": 12.0, "gross_margin": 30.0,
      "current_ratio": 1.0, "debt_to_equity": 2.0, "pe": 18.0, "revenue_growth": 20.0,
      "eps_growth": 25.0, "beta": 1.2, "dividend_yield": 0.0, "fcf_yield": 2.0}),
    ("ZOMATO", "Zomato", "Consumer Discretionary", "E-commerce", 250, 2.1e11,
     {"roe": 3.0, "net_margin": 2.0, "operating_margin": 1.0, "gross_margin": 15.0,
      "current_ratio": 2.0, "debt_to_equity": 0.0, "pe": 200.0, "revenue_growth": 60.0,
      "eps_growth": 30.0, "beta": 1.3, "dividend_yield": 0.0, "fcf_yield": 0.5}),
    ("DMART", "Avenue Supermarts", "Consumer Staples", "Retail", 4100, 2.7e11,
     {"roe": 18.0, "net_margin": 6.5, "operating_margin": 8.5, "gross_margin": 14.0,
      "current_ratio": 1.2, "debt_to_equity": 0.0, "pe": 90.0, "revenue_growth": 17.0,
      "eps_growth": 19.0, "beta": 0.7, "dividend_yield": 0.1, "fcf_yield": 1.5}),
]



def _generate_prices(ticker: str, base_price: float, days: int = 250) -> list[CompanyPrice]:
    import random

    rng = random.Random(abs(hash(ticker)) % (2**32))
    bars: list[CompanyPrice] = []
    start = date.today() - timedelta(days=days)
    price = base_price * 0.8
    for i in range(days):
        price *= 1 + rng.uniform(-0.02, 0.025)
        d = start + timedelta(days=i)
        bars.append(
            CompanyPrice(
                trade_date=d,
                open=Decimal(str(round(price * 0.995, 2))),
                high=Decimal(str(round(price * 1.02, 2))),
                low=Decimal(str(round(price * 0.98, 2))),
                close=Decimal(str(round(price, 2))),
                volume=int(1_000_000 + rng.randint(0, 2_000_000)),
            )
        )
    return bars


def _generate_statements(ticker: str, base_revenue: float, roe: float) -> list[FinancialStatement]:
    statements: list[FinancialStatement] = []
    now_year = date.today().year
    for i in range(5):
        year = now_year - 1 - i
        growth = 1.0 + 0.09 * i
        revenue = base_revenue * growth
        net_income = revenue * (roe / 100.0 * 1.1)
        statements.append(
            FinancialStatement(
                period_type="annual",
                fiscal_year=year,
                revenue=Decimal(str(int(revenue))),
                gross_profit=Decimal(str(int(revenue * 0.45))),
                operating_income=Decimal(str(int(revenue * 0.20))),
                net_income=Decimal(str(int(net_income))),
                total_assets=Decimal(str(int(revenue * 2.0))),
                total_liabilities=Decimal(str(int(revenue * 1.0))),
                total_equity=Decimal(str(int(revenue * 1.0))),
                total_debt=Decimal(str(int(revenue * 0.3))),
                cash_and_equivalents=Decimal(str(int(revenue * 0.2))),
                operating_cash_flow=Decimal(str(int(revenue * 0.18))),
                capex=Decimal(str(int(revenue * 0.03))),
                free_cash_flow=Decimal(str(int(revenue * 0.15))),
                eps=Decimal(str(round(10.0 * growth, 2))),
                diluted_shares=1_000_000_000,
            )
        )
    return statements


async def seed_database(db: AsyncSession, *, create_demo_user: bool = True) -> int:
    """Seed companies + metrics + synthetic history/statements. Returns count."""
    from app.repositories import company_repository

    now = datetime.now(timezone.utc)
    count = 0
    for ticker, name, sector, industry, price, market_cap, overrides in _COMPANIES:
        company = await company_repository.upsert_company_profile(
            db,
            ticker=ticker,
            name=name,
            exchange="NSE",
            sector=sector,
            industry=industry,
            description=f"{name} — a listed Indian {industry.lower()} company in the {sector} sector.",
            currency="INR",
            country="India",
        )

        raw: dict[str, float | None] = {
            "roe": overrides.get("roe"),
            "roa": overrides.get("roa", overrides.get("roe", 0) * 0.6),
            "net_margin": overrides.get("net_margin"),
            "operating_margin": overrides.get("operating_margin"),
            "gross_margin": overrides.get("gross_margin"),
            "current_ratio": overrides.get("current_ratio"),
            "quick_ratio": overrides.get("quick_ratio", (overrides.get("current_ratio", 1) or 1) * 0.8),
            "debt_to_equity": overrides.get("debt_to_equity"),
            "interest_coverage": overrides.get("interest_coverage", 8.0),
            "revenue_growth": overrides.get("revenue_growth"),
            "eps_growth": overrides.get("eps_growth"),
            "fcf_yield": overrides.get("fcf_yield"),
            "pe_ratio": overrides.get("pe"),
            "pb_ratio": overrides.get("pb", overrides.get("pe", 20) / 3),
            "ps_ratio": overrides.get("ps", overrides.get("pe", 20) / 5),
            "ev_ebitda": overrides.get("ev", overrides.get("pe", 20) * 0.8),
            "dividend_yield": overrides.get("dividend_yield"),
            "beta": overrides.get("beta"),
            "market_cap": market_cap,
            "price": price,
            "volume": int(2_000_000),
            "avg_volume": int(1_800_000),
        }

        # Synthetic history + statements for technical/risk engine variety.
        prices = _generate_prices(ticker, price)
        statements = _generate_statements(ticker, market_cap * 0.2, overrides.get("roe", 15))

        price_metrics = compute_price_metrics(
            [_price_bar(p) for p in prices]
        )
        raw.update(price_metrics)
        calculated = build_calculated_metrics(
            metrics=raw, statements=[_norm_stmt(s) for s in statements],
            prices=[_price_bar(p) for p in prices], market_cap=market_cap,
        )
        engine_inputs: dict[str, float | None] = {}
        for k, v in raw.items():
            if v is not None:
                engine_inputs[k] = float(v)
        for k, v in calculated.items():
            if v is not None:
                engine_inputs[k] = float(v)

        fundamental = compute_fundamental(engine_inputs)
        technical = compute_technical(engine_inputs)
        risk = compute_risk(engine_inputs)
        overall = compute_overall(
            fundamental.score, technical.score, risk.score,
            fundamental.confidence, technical.confidence, risk.confidence,
        )

        metrics_row = {
            "price": Decimal(str(round(price, 2))),
            "previous_close": Decimal(str(round(price * 0.995, 2))),
            "day_change": Decimal(str(round(price * 0.005, 2))),
            "day_change_pct": Decimal("0.5"),
            "volume": int(2_000_000),
            "avg_volume": int(1_800_000),
            "market_cap": Decimal(str(int(market_cap))),
            "high_52w": Decimal(str(round(price * 1.25, 2))),
            "low_52w": Decimal(str(round(price * 0.75, 2))),
            "fundamental_score": overall.fundamental,
            "technical_score": overall.technical,
            "risk_score": overall.risk,
            "overall_score": overall.score,
            "recommendation": overall.recommendation.lower(),
        }
        for k in ("pe_ratio", "pb_ratio", "ps_ratio", "ev_ebitda", "roe", "roa",
                  "gross_margin", "operating_margin", "net_margin", "revenue",
                  "revenue_growth", "net_income", "eps", "eps_growth",
                  "debt_to_equity", "current_ratio", "free_cash_flow",
                  "dividend_yield", "beta", "volatility_30d"):
            val = raw.get(k) or calculated.get(k)
            if val is not None:
                metrics_row[k] = Decimal(str(round(float(val), 4)))

        await company_repository.upsert_metrics(
            db, company, metrics_row, data_as_of=now, source="seed"
        )
        await company_repository.upsert_prices(
            db, company, [(p.trade_date, p.open, p.high, p.low, p.close, p.volume) for p in prices]
        )
        for st in statements:
            st.company_id = company.id
            db.add(st)
        count += 1

    if create_demo_user:
        await _seed_demo_user(db)

    await db.commit()
    logger.info("seeded %d companies", count)
    return count


async def _seed_demo_user(db: AsyncSession) -> None:
    from app.repositories import user_repository, company_repository

    existing = await user_repository.get_user_by_email(db, "demo@insight.com")
    if existing is not None:
        return
    user = await user_repository.create_user(
        db, email="demo@insight.com",
        password_hash=security.hash_password("Demo@12345"),
        full_name="Demo Investor",
    )
    
    portfolio = Portfolio(user_id=user.id, name="Long-term", description="Demo portfolio")
    db.add(portfolio)
    watchlist = Watchlist(user_id=user.id, name="Watchlist")
    db.add(watchlist)
    await db.flush()

    # Pre-populate portfolio holdings + watchlist for the demo flow.
    from app.repositories import portfolio_repository, watchlist_repository

    for ticker, qty, price in (("TCS", 100, 3400), ("INFY", 80, 1400), ("HDFCBANK", 50, 1600)):
        company = await company_repository.get_company_by_ticker(db, ticker)
        if company:
            await portfolio_repository.add_holding(
                db, portfolio_id=portfolio.id, company_id=company.id,
                quantity=Decimal(qty), average_buy_price=Decimal(price),
            )
    for ticker in ("RELIANCE", "ITC", "SUNPHARMA", "LT", "BHARTIARTL"):
        company = await company_repository.get_company_by_ticker(db, ticker)
        if company:
            await watchlist_repository.add_item(db, watchlist_id=watchlist.id, company_id=company.id)


def _price_bar(p: CompanyPrice):
    from app.integrations.market_data.schemas import NormalizedPriceBar

    return NormalizedPriceBar(
        ticker="", trade_date=p.trade_date, open=p.open, high=p.high, low=p.low,
        close=p.close, volume=p.volume,
    )


def _norm_stmt(s: FinancialStatement):
    from app.integrations.market_data.schemas import NormalizedFinancialStatements

    return NormalizedFinancialStatements(
        ticker="", period_type="annual", fiscal_year=s.fiscal_year,
        revenue=s.revenue, gross_profit=s.gross_profit, operating_income=s.operating_income,
        net_income=s.net_income, total_assets=s.total_assets, total_liabilities=s.total_liabilities,
        total_equity=s.total_equity, total_debt=s.total_debt, cash_and_equivalents=s.cash_and_equivalents,
        operating_cash_flow=s.operating_cash_flow, capex=s.capex, free_cash_flow=s.free_cash_flow,
        eps=s.eps, diluted_shares=s.diluted_shares,
    )
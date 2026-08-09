# INSIGHT

INSIGHT is a website — an AI-powered financial intelligence and investment research platform for Indian retail investors. It combines live market data, quantitative scoring engines (fundamental, technical, risk, overall), and AI-generated analysis in one place: track companies, screen the NSE universe with structured or natural-language filters, manage portfolios and watchlists, and follow the IPO calendar.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Run the Frontend](#run-the-frontend)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Company analysis** — fundamentals, ratios, technicals, and risk assessment with composite 0–100 scores and a buy/hold/sell recommendation.
- **AI insights** — AI-generated company summaries, risk/opportunity breakdowns, and contextual chat grounded in the platform's own data.
- **Market movers** — daily gainers/losers for the tracked universe.
- **IPO calendar** — ongoing, upcoming, and ended IPOs.
- **Stock screener** — structured filter builder plus natural-language screening.
- **Portfolios** — holdings with P&L math, allocation charts, a **What-if simulator** (edit quantities/prices, add or remove holdings, and preview the resulting stats without touching your real portfolio), and a first-time **onboarding wizard** that creates your first portfolio with suggested tickers.
- **Watchlists** — multi-list watchlists with live price enrichment.
- **Auth** — Google OAuth sign-in.
- **Caching** — Redis-backed TTL caching.

## Tech Stack

| Layer       | Technology |
|-------------|------------|
| Backend     | Python 3.12, FastAPI, SQLAlchemy 2 (async) + asyncpg, Alembic, Pydantic v2 |
| Frontend    | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Zustand, Recharts, lightweight-charts |
| Data        | PostgreSQL 16, Redis 7 |
| Market data | Financial Modeling Prep (FMP), Yahoo Finance |
| AI          | OpenAI, Google Gemini |
| Infra       | Docker Compose, uvicorn, pytest |

## Repository Structure

```
anugrahyadav1594-insight_t_309/
├── README.md
├── alembic.ini                   # empty placeholder — real config lives in backend/
├── docker-compose.yml            # copy of backend's compose — run compose from backend/
├── Dockerfile                    # empty placeholder — the working one is backend/Dockerfile
├── pytest.ini                    # empty placeholder
├── .env.example                  # empty placeholder — real template lives in backend/
├── backend/                      # FastAPI application
│   ├── alembic/
│   │   ├── env.py, script.py.mako
│   │   └── versions/             # 0001_initial_schema, 0002_ipo_calender, 0003_oauth_accounts
│   ├── app/
│   │   ├── main.py               # app factory, lifespan, exception handlers
│   │   ├── ai/                   # LLM providers (openai / gemini / local), prompt service, response validator
│   │   ├── api/
│   │   │   ├── middleware.py, deps.py, router.py
│   │   │   └── v1/               # auth, companies, dashboard, health, ipos, portfolios, screener, watchlists, ai
│   │   ├── core/                 # config, security, exceptions, logging, rate_limits
│   │   ├── db/                   # session, base, seed
│   │   ├── engines/              # fundamental, technical, risk, overall, metrics, movers, portfolio, recommendation
│   │   ├── integrations/
│   │   │   └── market_data/      # providers: fmp, yahoo, mock + client, factory, schemas
│   │   ├── models/               # SQLAlchemy models (company, ipo, portfolio, screener, user, watchlist, ai)
│   │   ├── repositories/         # data-access layer
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # business logic (auth, oauth, companies, portfolios, screener, …)
│   │   ├── utils/                # cache, pagination
│   │   └── workers/              # celery_app (placeholder), dispatcher, scheduler, tasks
│   ├── scripts/                  # dev.sh, seed, refresh_all
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── ai/                   # test_ai_service, test_response_validator
│   │   ├── fixtures/
│   │   ├── integration/          # test_auth, test_companies, test_fmp_live, test_google_oauth, test_health, test_market_data, test_portfolios, test_screener, test_watchlists
│   │   └── unit/                 # engines, normalizers, portfolio math, recommendation, scoring, validators
│   ├── Dockerfile
│   ├── docker-compose.yml        # ← the working compose file (postgres, redis, backend)
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── .env.example              # ← environment template (copy to .env)
├── frontend/                     # Next.js website
│   ├── README.md
│   ├── next.config.mjs
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   ├── app/
│   │   ├── globals.css, layout.tsx, page.tsx
│   │   ├── auth/google/callback/page.js
│   │   └── company/, dashboard/, portfolio/, profile/, screener/, watchlist/ pages
│   ├── components/
│   │   ├── auth/                 # AuthOverlay, GoogleButton, LoginForm, RegisterForm, …
│   │   ├── dashboard/
│   │   │   ├── company/          # analysis pages + shared/ widgets
│   │   │   ├── portfolio/        # PortfolioHeader, PortfolioOnboarding, PortfolioStats, charts
│   │   │   ├── screener/         # FilterBuilder, ResultsTable, presets, …
│   │   │   └── watchlist/        # WatchlistTable, stats, search, …
│   │   ├── landing/              # Hero, Features, Pricing, Faq, HowItWorks, Footer
│   │   ├── layout/Navbar.tsx
│   │   └── portfolio/PortfolioTab.tsx
│   └── lib/                      # api client, api/ endpoint modules, auth, types, data helpers
├── scripts/                      # root-level (empty placeholders)
└── tests/                        # root-level (empty placeholders)
```

> **Note:** the authoritative Dockerfile, compose file, requirements, and env template live under `backend/`. Run all compose commands from `backend/`.

## Prerequisites

- **Docker** with **Docker Compose v2** (recommended backend setup)
- **Node.js 20+** and **npm** (frontend)
- **Python 3.12** (backend only)
- **API keys** for live market data (Financial Modeling Prep) and AI (OpenAI or Gemini) — set them in `backend/.env`

## Quick Start with Docker

All commands run from the `backend/` directory.

### 1. Configure the environment

```bash
cd backend
cp .env.example .env
```

Add your API keys to `.env` (`FMP_API_KEY`, `LLM_API_KEY`, `LLM_PROVIDER`, …) as needed.

### 2. Start the stack

```bash
docker compose up --build -d postgres redis backend
```

This starts PostgreSQL, Redis, and the FastAPI backend (health-checked).

### 3. Apply migrations

```bash
docker compose run --rm backend alembic upgrade head
```

### 4. Seed the database

```bash
docker compose run --rm backend python -m scripts.seed
```

### 5. Verify

```bash
curl http://localhost:9056/health
```

- **API docs (Swagger):** <http://localhost:9056/docs>
- **ReDoc:** <http://localhost:9056/redoc>

### One-shot alternative

`backend/scripts/dev.sh` performs steps 2–4 automatically (compose up → wait for Postgres → migrate → seed → boot backend):

```bash
cd backend && bash scripts/dev.sh
```

## Run the Frontend

```bash
cd frontend
npm install
npm run build && npm run dev
```

Open the URL printed in the terminal (default: <http://localhost:3000>).

## Running Tests

Test suites live in `backend/tests/` (unit, integration, and AI).

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

- `pytest.ini` sets `asyncio_mode = auto` and registers `slow` / `integration` markers; `testpaths = tests`.
- The pure unit suite runs anywhere.
- DB-backed integration tests use `localhost:55432/insight_test` and skip automatically when no PostgreSQL test database is reachable — create one with:

```bash
docker compose exec postgres createdb -U postgres insight_test
```

- `tests/integration/test_fmp_live.py` and `test_google_oauth.py` additionally require real FMP / Google credentials and are skipped otherwise.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `docker compose` says the Dockerfile is empty / build fails at repo root | Run compose from `backend/` — the root-level Dockerfile is an empty placeholder; the working one is `backend/Dockerfile` |
| `connection refused` to Postgres from the app | Check `DATABASE_URL`: use `postgres:5432` inside compose, `localhost:55432` when the app runs on the host |
| `/health` returns `"status": "degraded"` | Inspect the `database` / `redis` fields; make sure compose services are healthy |
| Integration tests skip with “test database unavailable” | Start compose Postgres and create the test DB: `docker compose exec postgres createdb -U postgres insight_test` |

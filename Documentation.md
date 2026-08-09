# INSIGHT — Project Documentation

**INSIGHT** is an AI-powered financial intelligence and investment research website for Indian retail investors. It combines live market data, quantitative scoring engines, and AI-generated analysis: users can track companies, screen the NSE universe with structured or natural-language filters, manage portfolios and watchlists, and follow the IPO calendar.

**Version:** 1.0.0

---

## 1. System Architecture

### 1.1 Overview

INSIGHT is a full-stack web application with a React frontend, a modular FastAPI backend, and PostgreSQL + Redis data layer. The frontend is a single-page Next.js app that talks to the backend exclusively over a versioned REST API (`/api/v1`); the backend integrates with external market-data and AI providers server-side.

```
┌─────────────────────────────┐        REST /api/v1        ┌──────────────────────────────────────────┐
│  Frontend (Next.js 16)      │  ────────────────────────► │  Backend (FastAPI, Python 3.12)           │
│  React 19 · TypeScript      │  ◄──────────────────────── │  ├─ api/v1 routers (auth, companies, …)   │
│  Tailwind CSS 4 · Zustand   │      JSON responses        │  ├─ services (business logic)             │
│  Recharts · lightweight-    │                            │  ├─ repositories (data access)            │
│  charts · framer-motion     │                            │  ├─ engines (scoring & analysis)          │
└─────────────┬───────────────┘                            │  ├─ integrations/market_data (Yahoo)      │
              │                                            │  ├─ ai (Gemini, deterministic fallback)   │
              │                                            │  └─ workers (background tasks, scheduler) │
   ┌──────────▼───────────┐                                └───────┬───────────────┬───────────────────┘
   │ External services    │                                        │               │
   │ Google OAuth (login) │                  PostgreSQL 16         │   Redis 7     │
   └──────────────────────┘               (async SQLAlchemy,       │  (TTL cache)  │
                                          Alembic migrations)      └───────────────┘
```

### 1.2 Backend (FastAPI)

The backend is a layered, modular monolith under `backend/app/`:

| Layer | Contents |
|---|---|
| **API** | `api/v1/` routers for auth, companies, dashboard, health, ipos, portfolios, screener, watchlists, ai; middleware (CORS, request-ID); shared dependencies |
| **Services** | Business logic — auth & Google OAuth, company analysis, dashboard aggregation, portfolio/watchlist/screener/IPO services, market-data refresh |
| **Repositories** | Data-access layer over the SQLAlchemy models |
| **Engines** | Scoring engines: fundamental, technical, risk, overall, metrics, movers, portfolio, recommendation |
| **Integrations** | Pluggable market-data providers (FMP, Yahoo) behind a common interface with a provider factory |
| **AI** | LLM providers (Gemini, with deterministic fallback), prompt service, context builder, response validator |
| **Workers** | Background-task dispatcher and an optional in-process auto-refresh scheduler |
| **Core** | Configuration (pydantic-settings), security (JWT, password hashing), exceptions, logging |

**Database & caching** — PostgreSQL 16 with async SQLAlchemy + asyncpg, migrations via Alembic (initial schema, IPO calendar, OAuth accounts). Redis 7 provides TTL-based caching of market data and analysis results.

**Authentication** — Google OAuth 2.0 sign-in (authorization-code flow). The backend issues JWT access + refresh tokens that the frontend stores and sends as `Authorization: Bearer <token>`.

### 1.3 Frontend (Next.js)

The frontend (`frontend/`) is a Next.js 16 App-Router application: public landing page, Google OAuth callback route, and authenticated areas (dashboard, company analysis, portfolio, watchlist, screener, profile). A typed API client in `lib/api/` wraps every backend endpoint; UI state is managed with React hooks + Zustand, and charts use Recharts and lightweight-charts.

### 1.4 Deployment topology

All services run via Docker Compose (`backend/docker-compose.yml`):

| Service | Image | Host port |
|---|---|---|
| backend | custom (python:3.12-slim, uvicorn) | 9056 → 8000 |
| postgres | postgres:16-alpine | 55432 → 5432 |
| redis | redis:7-alpine | 56379 → 6379 |

---

## 2. API Endpoints

Base URL: `http://localhost:9056` · Business endpoints are prefixed with `/api/v1` · Interactive docs at `/docs` (Swagger) and `/redoc`.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness: app version, DB / Redis / provider status |
| **Auth** | | |
| POST | `/api/v1/auth/register` | Create an account |
| POST | `/api/v1/auth/login` | Sign in — returns access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Rotate tokens |
| POST | `/api/v1/auth/logout` | Revoke session (204) |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/auth/google/authorize` | Start Google OAuth sign-in |
| GET | `/api/v1/auth/google/callback` | Google OAuth callback → issues tokens |
| **Companies** | | |
| GET | `/api/v1/companies/search?q=…` | Search companies by ticker/name |
| GET | `/api/v1/companies/{ticker}` | Full analysis: quote, scores, AI summary |
| GET | `/api/v1/companies/movers/list?period=1D&direction=gainers` | Daily gainers/losers |
| **Dashboard / IPOs** | | |
| GET | `/api/v1/dashboard` | Aggregated home payload |
| GET | `/api/v1/ipos` | IPO calendar (ongoing / upcoming / ended) |
| **Portfolios** | | |
| GET / POST | `/api/v1/portfolios` | List / create portfolios |
| GET | `/api/v1/portfolios/{id}` | Portfolio detail with holdings math |
| POST | `/api/v1/portfolios/{id}/holdings` | Add a holding |
| PUT / DELETE | `/api/v1/portfolios/{id}/holdings/{holding_id}` | Update / remove a holding |
| POST | `/api/v1/portfolios/{id}/what-if` | What-if simulation (no mutation) |
| POST | `/api/v1/portfolios/{id}/analyze` | AI portfolio analysis |
| **Watchlists** | | |
| GET / POST | `/api/v1/watchlists` | List / create watchlists |
| GET | `/api/v1/watchlists/{id}` | Watchlist with live price enrichment |
| POST / DELETE | `/api/v1/watchlists/{id}/items[/{ticker}]` | Add / remove a ticker |
| **Screener / AI** | | |
| POST | `/api/v1/screener/query` | Structured or natural-language stock screening |
| POST | `/api/v1/ai/chat` | Contextual AI chat grounded in platform data |

Authenticated endpoints accept `Authorization: Bearer <access_token>`.

---

## 3. Setup Guide

### 3.1 Prerequisites

- Docker with Docker Compose v2
- Node.js 20+ and npm
- Python 3.12 (backend runs, tests)
- API keys: Financial Modeling Prep (`FMP_API_KEY`) for market data; a Gemini API key (`LLM_API_KEY`, `LLM_PROVIDER=gemini`) for AI features; Google OAuth client ID/secret for sign-in

### 3.2 Backend (Docker, recommended)

```bash
cd backend
cp .env.example .env          # then set JWT_SECRET_KEY, FMP_API_KEY, LLM_API_KEY,
                              # LLM_PROVIDER, GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
docker compose up --build -d postgres redis backend
docker compose run --rm backend alembic upgrade head
docker compose run --rm backend python -m scripts.seed
```

Verify: `curl http://localhost:9056/health` → `{"status":"ok",…}` · API docs at `http://localhost:9056/docs`.

One-shot alternative: `cd backend && bash scripts/dev.sh` (boots compose, waits for Postgres, migrates, seeds, starts the backend).

### 3.3 Frontend

```bash
cd frontend
npm install
npm run build && npm run dev
```

Open the printed URL (default `http://localhost:3000`). The API base URL defaults to `http://localhost:9056` (`NEXT_PUBLIC_API_URL` in `frontend/.env.example`).

### 3.4 Tests

```bash
cd backend
pip install -r requirements-dev.txt
docker compose exec postgres createdb -U postgres insight_test   # once
pytest
```

Unit tests run standalone; DB-backed integration tests use `localhost:55432/insight_test` and skip automatically if it is unreachable. `test_fmp_live.py` and `test_google_oauth.py` need real credentials.

---

## 4. Feature Breakdown

| Feature | Description |
|---|---|
| **Company Analysis & Scoring** | Fundamentals, ratios, technicals and risk assessment; composite 0–100 scores per dimension plus an overall score and buy/hold/sell recommendation, computed by dedicated scoring engines |
| **AI Insights & Chat** | AI-generated company summaries, strengths/risks/opportunities, and a chat assistant whose answers are grounded in the platform's own company data |
| **Market Movers** | Daily gainers and losers for the tracked universe with configurable period and direction |
| **IPO Calendar** | Ongoing, upcoming and ended IPOs for the Indian market |
| **Stock Screener** | Build structured multi-filter screens (with saved screens) or describe the screen in natural language |
| **Portfolio Management** | Holdings with live P&L math, allocation charts, contribution analysis, a **What-if simulator** (edit quantities/prices, add/remove holdings, preview the outcome without mutating the portfolio), AI portfolio analysis, and a first-time onboarding wizard |
| **Watchlists** | Multiple watchlists with live price enrichment |
| **Dashboard** | A single aggregated home view combining movers, IPO calendar, portfolio and watchlist summaries |
| **Authentication** | Google OAuth sign-in |

---

*Built with FastAPI, Next.js, PostgreSQL and Redis. See `README.md` for repository-level details.*

# INSIGHT Backend

FastAPI modular monolith - see ../docs/ARCHITECTURE.md for architecture.

## Quickstart (Docker)

1. cp .env.example .env  and fill in secrets (JWT_SECRET_KEY, FMP_API_KEY, LLM_API_KEY)
2. docker compose up --build
3. docker compose exec backend alembic upgrade head
4. docker compose exec backend python -m scripts.seed
5. Open http://localhost:9056/docs

Ports (unconventional on purpose): API 9056, Postgres 55432, Redis 56379, frontend dev server 5513.

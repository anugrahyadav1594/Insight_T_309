#!/usr/bin/env bash
# Dev shortcut: boot compose, migrate, seed, warm caches (ARCHITECTURE.md §27.2).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building & starting services (postgres, redis, backend)..."
docker compose up --build -d postgres redis

echo "==> Waiting for postgres..."
until docker compose exec -T postgres pg_isready -U postgres; do sleep 1; done

echo "==> Migrating schema..."
docker compose run --rm backend alembic upgrade head

echo "==> Seeding database..."
docker compose run --rm backend python -m scripts.seed

echo "==> Booting backend on http://localhost:9056 ..."
docker compose up --build -d backend
echo "Open http://localhost:9056/docs (Swagger)"
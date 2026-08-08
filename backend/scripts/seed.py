"""Seed the database with bundled Indian companies (§4.16, §27).

Usage:
    python -m scripts.seed
"""

from __future__ import annotations

import asyncio
import sys

from app.db.seed import seed_database


async def main() -> int:
    from app.db.session import async_session_factory

    async with async_session_factory() as db:
        count = await seed_database(db, create_demo_user=True)
    print(f"Seeded {count} companies + demo user.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
"""
aiosqlite connection pool for local dev.
The architecture specifies PostgreSQL for production (asyncpg).
For local dev we use aiosqlite -- same query structure, different driver.
Swap connection.py for the asyncpg version on deploy.
"""
import aiosqlite
import asyncio
from pathlib import Path
from backend.config import DB_PATH

_db: aiosqlite.Connection | None = None
_lock = asyncio.Lock()


async def get_db() -> aiosqlite.Connection:
    """Return the singleton DB connection. Create + init on first call."""
    global _db
    if _db is None:
        async with _lock:
            if _db is None:
                _db = await aiosqlite.connect(DB_PATH)
                _db.row_factory = aiosqlite.Row
                await _db.execute("PRAGMA journal_mode=WAL")
                await _db.execute("PRAGMA foreign_keys=ON")
                await _init_schema()
    return _db


async def _init_schema():
    """Run all migrations on startup."""
    migrations_dir = Path(__file__).parent / "migrations"
    for migration_file in sorted(migrations_dir.glob("*.sql")):
        sql = migration_file.read_text()
        statements = [s.strip() for s in sql.split(";") if s.strip()]
        for stmt in statements:
            try:
                await _db.execute(stmt)
            except Exception:
                pass  # tables already exist -- idempotent
    await _db.commit()


async def close_db():
    global _db
    if _db:
        await _db.close()
        _db = None

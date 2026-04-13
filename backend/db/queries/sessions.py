"""
Session DB queries -- C-07: parameterized only, no string formatting in SQL.
"""
import uuid
from datetime import datetime, timedelta, timezone
from backend.db.connection import get_db


async def create_session() -> str:
    """Create a new session, return its UUID string."""
    db = await get_db()
    session_id = str(uuid.uuid4())
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=7)
    ).isoformat()
    await db.execute(
        # C-07: parameterized query
        "INSERT INTO sessions (id, expires_at) VALUES (?, ?)",
        (session_id, expires_at),
    )
    await db.commit()
    return session_id


async def get_session(session_id: str) -> dict | None:
    """Fetch session row by ID. Returns None if not found or expired."""
    db = await get_db()
    async with db.execute(
        # C-07: parameterized
        "SELECT id, expires_at FROM sessions WHERE id = ?",
        (session_id,),
    ) as cursor:
        row = await cursor.fetchone()
    if row is None:
        return None
    # Check expiry
    try:
        expires_at = datetime.fromisoformat(row["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return None
    except Exception:
        return None
    return dict(row)


async def touch_session(session_id: str):
    """Update last_active_at."""
    db = await get_db()
    await db.execute(
        "UPDATE sessions SET last_active_at = datetime('now') WHERE id = ?",
        (session_id,),
    )
    await db.commit()


async def has_active_game(session_id: str) -> bool:
    """True if session has at least one active game."""
    db = await get_db()
    async with db.execute(
        "SELECT COUNT(*) FROM games WHERE session_id = ? AND status = 'active'",
        (session_id,),
    ) as cursor:
        row = await cursor.fetchone()
    return row[0] > 0


async def cleanup_expired_sessions():
    """Remove expired sessions (cascade-deletes their games)."""
    db = await get_db()
    await db.execute(
        "DELETE FROM sessions WHERE expires_at < datetime('now')"
    )
    await db.commit()

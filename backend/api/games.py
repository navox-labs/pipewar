"""
Game management endpoints.
Security constraints: C-02, C-06.
"""
import asyncio
import logging
import time
from fastapi import APIRouter, Request, HTTPException
from backend.db.queries.sessions import get_session, touch_session, has_active_game
from backend.db.queries.games import (
    create_game, get_active_game, abandon_game, count_active_games,
)
from backend.config import COOKIE_NAME, MAX_ACTIVE_GAMES

log = logging.getLogger(__name__)
router = APIRouter()

# In-memory rate limit: 3 game creations per session per minute (C-02)
_game_creation: dict[str, list[float]] = {}


def _check_game_rate_limit(session_id: str) -> bool:
    now = time.monotonic()
    window = 60.0
    limit = 3
    hits = _game_creation.get(session_id, [])
    hits = [t for t in hits if now - t < window]
    if len(hits) >= limit:
        return False
    hits.append(now)
    _game_creation[session_id] = hits
    return True


async def _get_valid_session(request: Request) -> str:
    """Extract and validate session from cookie. Raises 401 on failure."""
    session_id = request.cookies.get(COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=401, detail="No session")
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    await touch_session(session_id)
    return session_id


@router.post("/games", status_code=201)
async def create_game_endpoint(request: Request) -> dict:
    """
    Create a new game for this session.
    C-02: Rate limit, global game cap.
    """
    session_id = await _get_valid_session(request)

    # C-02: rate limit game creation
    if not _check_game_rate_limit(session_id):
        raise HTTPException(status_code=429, detail="Too many games created")

    # C-02: global game cap
    active_count = await count_active_games()
    if active_count >= MAX_ACTIVE_GAMES:
        raise HTTPException(status_code=503, detail="Server at capacity")

    # Abandon any existing active game first
    from backend.api.websocket import game_engines
    existing = await get_active_game(session_id)
    if existing:
        old_engine = game_engines.get(existing["game_id"])
        if old_engine:
            old_engine.stop()
            del game_engines[existing["game_id"]]
        await abandon_game(session_id)

    game = await create_game(session_id)

    # Start the engine
    from backend.api.websocket import start_engine
    await start_engine(game["game_id"], game["grid"])

    return game


@router.get("/games/current")
async def get_current_game(request: Request) -> dict:
    session_id = await _get_valid_session(request)
    game = await get_active_game(session_id)
    if not game:
        raise HTTPException(status_code=404, detail="No active game")
    return game


@router.delete("/games/current")
async def delete_current_game(request: Request) -> dict:
    session_id = await _get_valid_session(request)
    game = await get_active_game(session_id)
    if not game:
        raise HTTPException(status_code=404, detail="No active game")

    from backend.api.websocket import game_engines
    engine = game_engines.get(game["game_id"])
    if engine:
        engine.stop()
        del game_engines[game["game_id"]]

    await abandon_game(session_id)
    return {"status": "abandoned"}

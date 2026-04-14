"""
Session management endpoints.
Security constraints: C-02, C-05, C-06.
"""
import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request, Response, HTTPException
from backend.db.queries.sessions import (
    create_session, get_session, touch_session, has_active_game,
)
from backend.models.schemas import SessionResponse, SessionMeResponse
from backend.config import COOKIE_NAME, SESSION_TTL_DAYS, IS_PRODUCTION

log = logging.getLogger(__name__)
router = APIRouter()

# In-memory rate limiting for session creation (C-02: 5/min per IP)
_session_creation: dict[str, list[float]] = {}

import time

def _check_session_rate_limit(ip: str) -> bool:
    """Return True if allowed, False if rate limited."""
    now = time.monotonic()
    window = 60.0  # 1 minute
    limit = 5
    hits = _session_creation.get(ip, [])
    hits = [t for t in hits if now - t < window]
    if len(hits) >= limit:
        return False
    hits.append(now)
    _session_creation[ip] = hits
    return True


@router.post("/sessions", status_code=201)
async def create_session_endpoint(
    request: Request,
    response: Response,
) -> dict:
    """
    Create a new session. Sets HttpOnly cookie.
    C-05: session_id never in response body.
    C-02: 5/min per IP.
    """
    client_ip = request.client.host if request.client else "unknown"
    if not _check_session_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many sessions created")

    # Check if request already has a valid session
    existing_session_id = request.cookies.get(COOKIE_NAME)
    if existing_session_id:
        session = await get_session(existing_session_id)
        if session:
            await touch_session(existing_session_id)
            active = await has_active_game(existing_session_id)
            expires = (
                datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
            ).isoformat()
            return {"expires_at": expires, "has_active_game": active, "ws_token": existing_session_id}

    session_id = await create_session()
    expires_at = (
        datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    ).isoformat()

    # C-05: set session via cookie only, not in body
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=SESSION_TTL_DAYS * 86400,
        path="/",
    )

    # ws_token allows the frontend to authenticate WebSocket connections
    # directly to Fly.io when REST goes through Vercel proxy
    return {"expires_at": expires_at, "has_active_game": False, "ws_token": session_id}


@router.get("/sessions/me")
async def get_session_me(request: Request) -> dict:
    """
    Return session status.
    C-05: no session_id in body.
    """
    session_id = request.cookies.get(COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=401, detail="No session")

    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    await touch_session(session_id)
    active = await has_active_game(session_id)
    return {"has_active_game": active}

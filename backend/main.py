"""
PIPEWAR FastAPI application entry point.
Security constraints implemented here: C-06 (CORS), C-10 (security headers).
"""
import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import FRONTEND_ORIGIN
from backend.db.connection import get_db, close_db
from backend.api import sessions, games, websocket

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

app = FastAPI(title="PIPEWAR", version="1.0.0")

# ---------------------------------------------------------------------------
# C-06: CORS -- exact frontend origin only, never wildcard
# ---------------------------------------------------------------------------
_allowed_origins = [
    FRONTEND_ORIGIN,
    "https://frontend-three-cyan-85.vercel.app",
    "https://frontend-beta-five-83.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,          # required for cookie-based sessions
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

# ---------------------------------------------------------------------------
# C-10: Security headers middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(sessions.router, prefix="/api")
app.include_router(games.router, prefix="/api")
app.include_router(websocket.router, prefix="/api")

# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    log.info("Starting PIPEWAR backend...")
    await get_db()  # initialise DB + run migrations
    log.info("Database ready")


@app.on_event("shutdown")
async def shutdown():
    log.info("Shutting down PIPEWAR backend...")
    # Save all active engines
    from backend.api.websocket import game_engines
    for engine in game_engines.values():
        engine.stop()
    await close_db()


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}

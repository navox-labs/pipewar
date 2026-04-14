"""
WebSocket handler for real-time game communication.
Security constraints: C-01, C-03, C-04, C-08, C-09.
"""
from __future__ import annotations
import asyncio
import json
import logging
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from backend.config import (
    COOKIE_NAME, WS_RATE_LIMIT, WS_RATE_VIOLATION_LIMIT,
    WS_MAX_MESSAGE_BYTES, WS_GLOBAL_CAP,
)
from backend.db.queries.sessions import get_session
from backend.db.queries.games import get_game_by_id, save_game
from backend.engine.game_engine import GameEngine
from backend.engine.grid import serialize_grid
from backend.models.schemas import parse_client_message
from backend.models.enums import BuildingType, Direction

log = logging.getLogger(__name__)
router = APIRouter()

# Global registry: game_id -> GameEngine
game_engines: dict[str, GameEngine] = {}

# Global registry: game_id -> WebSocket (C-09: 1 WS per game)
active_connections: dict[str, WebSocket] = {}

# Global connection count (C-09: cap at 250)
_total_connections: int = 0


async def start_engine(game_id: str, grid_state: dict, **kwargs) -> GameEngine:
    """
    Start a GameEngine for the given game. Called by games.py on game creation
    or by WS handler on reconnect.
    """
    if game_id in game_engines:
        return game_engines[game_id]

    engine = GameEngine(game_id=game_id, grid_state=grid_state, **kwargs)
    engine.on_broadcast = _broadcast
    engine.on_save = lambda: _save_engine(engine)
    game_engines[game_id] = engine

    # Run in background task
    asyncio.create_task(engine.run())
    return engine


async def _broadcast(game_id: str, message: dict):
    """Send a message to the WebSocket connected to this game."""
    ws = active_connections.get(game_id)
    if ws is None:
        return
    try:
        await ws.send_text(json.dumps(message))
    except Exception:
        pass  # client disconnected


async def _save_engine(engine: GameEngine):
    """Persist current engine state to DB."""
    try:
        uptime = engine._uptime_pct()
        await save_game(
            game_id=engine.game_id,
            grid_state=engine.get_serializable_grid(),
            advanced_circuits=engine.advanced_circuits,
            uptime_pct=round(uptime, 2),
            current_wave=engine.current_wave,
            total_ticks=engine.total_ticks,
            downtime_ticks=engine.downtime_ticks,
        )
    except Exception as e:
        log.error(f"Engine save failed: {e}")


@router.websocket("/games/{game_id}/ws")
async def websocket_endpoint(websocket: WebSocket, game_id: str):
    global _total_connections

    # --- C-09: global connection cap ---
    if _total_connections >= WS_GLOBAL_CAP:
        await websocket.close(code=1013)  # Try again later
        return

    # --- C-03: validate session ---
    # Try cookie first, fall back to query param (needed when REST goes
    # through Vercel proxy but WS connects directly to Fly.io)
    session_id = websocket.cookies.get(COOKIE_NAME)
    if not session_id:
        session_id = websocket.query_params.get("session")
    if not session_id:
        await websocket.close(code=4001)
        return

    session = await get_session(session_id)
    if not session:
        await websocket.close(code=4001)
        return

    # --- C-03: validate game ownership ---
    game = await get_game_by_id(game_id)
    if not game:
        await websocket.close(code=4004)
        return
    if game["session_id"] != session_id:
        await websocket.close(code=4003)
        return
    if game["status"] not in ("active",):
        await websocket.close(code=4004)
        return

    # --- C-09: 1 WS per game -- close old connection ---
    old_ws = active_connections.get(game_id)
    if old_ws is not None:
        try:
            await old_ws.close(code=4000)
        except Exception:
            pass

    # Accept and register
    await websocket.accept()
    active_connections[game_id] = websocket
    _total_connections += 1

    # --- Get or start engine ---
    engine = game_engines.get(game_id)
    if engine is None:
        engine = await start_engine(
            game_id=game_id,
            grid_state=game["grid"],
            advanced_circuits=game.get("advanced_circuits", 0),
            total_ticks=game.get("total_ticks", 0),
            downtime_ticks=game.get("downtime_ticks", 0),
            current_wave=game.get("current_wave", 0),
        )

    engine.mark_active()

    # Send full state sync on connect
    try:
        await websocket.send_text(json.dumps(engine.get_state_snapshot()))
    except Exception:
        pass

    # --- Rate limiter state (C-01) ---
    msg_timestamps: list[float] = []
    violations: int = 0

    try:
        while True:
            # Receive raw text
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_text(json.dumps({"type": "ping"}))
                except Exception:
                    break
                continue

            # C-04: enforce max message size
            if len(raw.encode()) > WS_MAX_MESSAGE_BYTES:
                await _send_error(websocket, "Message too large")
                continue

            # C-01: rate limiting -- max WS_RATE_LIMIT messages per second
            now = time.monotonic()
            msg_timestamps = [t for t in msg_timestamps if now - t < 1.0]
            if len(msg_timestamps) >= WS_RATE_LIMIT:
                violations += 1
                log.warning(f"WS rate limit violation #{violations} for game {game_id}")
                if violations >= WS_RATE_VIOLATION_LIMIT:
                    log.warning(f"Disconnecting {game_id} for rate limit abuse")
                    await websocket.close(code=1008)
                    break
                await _send_error(websocket, "Rate limit exceeded")
                continue
            msg_timestamps.append(now)

            # Parse JSON
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await _send_error(websocket, "Invalid JSON")
                continue

            # C-04: Pydantic validation
            try:
                msg = parse_client_message(data)
            except (ValidationError, ValueError) as e:
                await _send_error(websocket, "Invalid message")
                continue

            # Dispatch
            engine.mark_active()
            await _handle_message(engine, websocket, msg)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.error(f"WS error for game {game_id}: {e}")
    finally:
        # Clean up
        active_connections.pop(game_id, None)
        _total_connections = max(0, _total_connections - 1)

        # Save on disconnect
        if game_id in game_engines:
            asyncio.create_task(_save_engine(game_engines[game_id]))


async def _handle_message(engine: GameEngine, ws: WebSocket, msg):
    """Dispatch a validated client message to the engine."""
    msg_type = msg.type

    if msg_type == "place_building":
        err = engine.place_building(
            x=msg.x, y=msg.y,
            building_type=BuildingType(msg.building_type),
            direction=Direction(msg.direction),
        )
        if err:
            await _send_error(ws, err)
        else:
            await ws.send_text(json.dumps({
                "type": "building_placed",
                "x": msg.x,
                "y": msg.y,
                "building_type": BuildingType(msg.building_type).value,
                "direction": Direction(msg.direction).value,
            }))

    elif msg_type == "remove_building":
        err = engine.remove_building(x=msg.x, y=msg.y)
        if err:
            await _send_error(ws, err)
        else:
            await ws.send_text(json.dumps({
                "type": "building_removed",
                "x": msg.x,
                "y": msg.y,
            }))

    elif msg_type == "rotate_building":
        err = engine.rotate_building(
            x=msg.x, y=msg.y,
            direction=Direction(msg.direction),
        )
        if err:
            await _send_error(ws, err)

    elif msg_type == "toggle_pause":
        engine.toggle_pause()


async def _send_error(ws: WebSocket, message: str):
    """C-08: safe error messages only."""
    try:
        await ws.send_text(json.dumps({"type": "error", "message": message}))
    except Exception:
        pass

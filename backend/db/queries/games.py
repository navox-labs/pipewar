"""
Game DB queries -- C-07: parameterized only.
"""
import uuid
import json
from backend.db.connection import get_db
from backend.engine.grid import build_initial_grid


async def count_active_games() -> int:
    db = await get_db()
    async with db.execute(
        "SELECT COUNT(*) FROM games WHERE status = 'active'"
    ) as cursor:
        row = await cursor.fetchone()
    return row[0]


async def create_game(session_id: str) -> dict:
    """Create a new game with the initial grid state."""
    db = await get_db()
    game_id = str(uuid.uuid4())
    initial_grid = build_initial_grid()
    await db.execute(
        """INSERT INTO games
           (id, session_id, grid_state)
           VALUES (?, ?, ?)""",
        (game_id, session_id, json.dumps(initial_grid)),
    )
    await db.commit()
    return {
        "game_id": game_id,
        "status": "active",
        "grid": initial_grid,
        "advanced_circuits": 0,
        "uptime_pct": 100.0,
        "current_wave": 0,
    }


async def get_active_game(session_id: str) -> dict | None:
    db = await get_db()
    async with db.execute(
        """SELECT id, status, grid_state, advanced_circuits_produced,
                  uptime_pct, current_wave, total_ticks, downtime_ticks
           FROM games
           WHERE session_id = ? AND status = 'active'
           LIMIT 1""",
        (session_id,),
    ) as cursor:
        row = await cursor.fetchone()
    if row is None:
        return None
    return {
        "game_id": row["id"],
        "status": row["status"],
        "grid": json.loads(row["grid_state"]),
        "advanced_circuits": row["advanced_circuits_produced"],
        "uptime_pct": row["uptime_pct"],
        "current_wave": row["current_wave"],
        "total_ticks": row["total_ticks"],
        "downtime_ticks": row["downtime_ticks"],
    }


async def get_game_by_id(game_id: str) -> dict | None:
    db = await get_db()
    async with db.execute(
        """SELECT id, session_id, status, grid_state,
                  advanced_circuits_produced, uptime_pct, current_wave,
                  total_ticks, downtime_ticks
           FROM games WHERE id = ?""",
        (game_id,),
    ) as cursor:
        row = await cursor.fetchone()
    if row is None:
        return None
    return {
        "game_id": row["id"],
        "session_id": row["session_id"],
        "status": row["status"],
        "grid": json.loads(row["grid_state"]),
        "advanced_circuits": row["advanced_circuits_produced"],
        "uptime_pct": row["uptime_pct"],
        "current_wave": row["current_wave"],
        "total_ticks": row["total_ticks"],
        "downtime_ticks": row["downtime_ticks"],
    }


async def save_game(
    game_id: str,
    grid_state: dict,
    advanced_circuits: int,
    uptime_pct: float,
    current_wave: int,
    total_ticks: int,
    downtime_ticks: int,
    status: str = "active",
):
    db = await get_db()
    await db.execute(
        """UPDATE games SET
               grid_state = ?,
               advanced_circuits_produced = ?,
               uptime_pct = ?,
               current_wave = ?,
               total_ticks = ?,
               downtime_ticks = ?,
               status = ?,
               updated_at = datetime('now')
           WHERE id = ?""",
        (
            json.dumps(grid_state),
            advanced_circuits,
            uptime_pct,
            current_wave,
            total_ticks,
            downtime_ticks,
            status,
            game_id,
        ),
    )
    await db.commit()


async def abandon_game(session_id: str):
    db = await get_db()
    await db.execute(
        """UPDATE games SET status = 'abandoned', updated_at = datetime('now')
           WHERE session_id = ? AND status = 'active'""",
        (session_id,),
    )
    await db.commit()


async def record_wave(
    game_id: str,
    wave_number: int,
    attack_types: list[str],
    attackers_spawned: int,
    attackers_blocked: int,
    attackers_leaked: int,
    damage_dealt: int,
):
    import uuid as _uuid
    db = await get_db()
    await db.execute(
        """INSERT INTO wave_history
           (id, game_id, wave_number, attack_types, attackers_spawned,
            attackers_blocked, attackers_leaked, damage_dealt, ended_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
        (
            str(_uuid.uuid4()),
            game_id,
            wave_number,
            json.dumps(attack_types),
            attackers_spawned,
            attackers_blocked,
            attackers_leaked,
            damage_dealt,
        ),
    )
    await db.commit()

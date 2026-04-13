"""
Attacker data and movement logic.
Architecture doc sections 6.1, 6.5.
"""
from __future__ import annotations
import uuid
import random
from backend.models.enums import AttackType, BuildingType, PRODUCTION_TYPES, DEFENSE_TYPES
from backend.models.game_state import Attacker, Cell
from backend.combat.pathfinding import astar, compute_defense_coverage
from backend.config import GRID_SIZE

# Attacker base stats (architecture doc table 6.1)
ATTACKER_STATS: dict[AttackType, dict] = {
    AttackType.DDOS_BOT: {
        "hp": 30,
        "speed": 0.15,
        "damage_per_tick": 2,
    },
    AttackType.CREDENTIAL_STUFFER: {
        "hp": 60,
        "speed": 0.10,
        "damage_per_tick": 5,
    },
    AttackType.SQL_INJECTION_PROBE: {
        "hp": 80,
        "speed": 0.08,
        "damage_per_tick": 10,
    },
    AttackType.PEAK_LOAD_ATTACK: {
        "hp": 50,
        "speed": 0.20,
        "damage_per_tick": 8,
    },
    AttackType.ZERO_DAY_EXPLOIT: {
        "hp": 300,
        "speed": 0.05,
        "damage_per_tick": 25,
    },
}

# Ticks to wait without a valid path before despawning
IDLE_BEFORE_DESPAWN = 10

# Max trail positions kept per attacker
TRAIL_LENGTH = 3


def spawn_attacker(
    attack_type: AttackType,
    hp_scale: float = 1.0,
) -> Attacker:
    """Create a new Attacker at a random east-edge spawn point."""
    stats = ATTACKER_STATS[attack_type]
    base_hp = stats["hp"]
    scaled_hp = max(1, int(base_hp * hp_scale))
    spawn_y = random.randint(0, GRID_SIZE - 1)
    return Attacker(
        id=str(uuid.uuid4()),
        attack_type=attack_type,
        x=float(GRID_SIZE - 1),  # east edge (x=19)
        y=float(spawn_y),
        hp=scaled_hp,
        max_hp=scaled_hp,
        speed=stats["speed"],
        damage_per_tick=stats["damage_per_tick"],
    )


def tick_attacker(
    attacker: Attacker,
    cells: dict[tuple[int, int], Cell],
    defense_coverage: dict[tuple[int, int], set[BuildingType]],
) -> dict:
    """
    Advance one attacker for one tick.

    Returns a result dict:
        {
          "alive": bool,
          "damage": int,       # damage dealt to buildings this tick
          "reached_goal": bool # attacker reached a production building
        }
    """
    result = {"alive": True, "damage": 0, "reached_goal": False}

    if attacker.hp <= 0:
        result["alive"] = False
        return result

    # --- Apply defense damage ---
    current_cell = (int(attacker.x), int(attacker.y))
    coverage = defense_coverage.get(current_cell, set())
    defense_dps = _calculate_defense_dps(coverage, attacker)
    attacker.hp -= defense_dps

    if attacker.hp <= 0:
        result["alive"] = False
        return result

    # --- Find a path if we don't have one ---
    if not attacker.path:
        target = _find_nearest_production_machine(attacker, cells)
        if target is None:
            attacker.idle_ticks += 1
            if attacker.idle_ticks >= IDLE_BEFORE_DESPAWN:
                result["alive"] = False
            return result

        path = astar(
            start=(int(attacker.x), int(attacker.y)),
            goal=target,
            cells=cells,
            attack_type=attacker.attack_type,
            defense_coverage=defense_coverage,
        )
        if path is None:
            attacker.idle_ticks += 1
            if attacker.idle_ticks >= IDLE_BEFORE_DESPAWN:
                result["alive"] = False
            return result

        attacker.path = path
        attacker.path_index = 0
        attacker.idle_ticks = 0

    # --- Move along path ---
    _move_attacker(attacker)

    # --- Record trail ---
    attacker.trail.append((attacker.x, attacker.y))
    if len(attacker.trail) > TRAIL_LENGTH:
        attacker.trail.pop(0)

    # --- Check if we've reached a production machine ---
    cell_x, cell_y = int(attacker.x), int(attacker.y)
    current = cells.get((cell_x, cell_y))
    if current and current.building and current.building.type in PRODUCTION_TYPES:
        # Deal damage
        damage = attacker.damage_per_tick
        current.building.health = max(0, current.building.health - damage)
        result["damage"] = damage
        result["reached_goal"] = True

    return result


def _move_attacker(attacker: Attacker):
    """Move attacker along its path by speed units."""
    if not attacker.path or attacker.path_index >= len(attacker.path):
        return

    remaining_speed = attacker.speed
    while remaining_speed > 0 and attacker.path_index < len(attacker.path):
        target_cell = attacker.path[attacker.path_index]
        tx, ty = float(target_cell[0]), float(target_cell[1])
        dx = tx - attacker.x
        dy = ty - attacker.y
        dist = (dx ** 2 + dy ** 2) ** 0.5

        if dist <= remaining_speed:
            # Snap to waypoint
            attacker.x = tx
            attacker.y = ty
            attacker.path_index += 1
            remaining_speed -= dist
        else:
            # Move towards waypoint
            ratio = remaining_speed / dist
            attacker.x += dx * ratio
            attacker.y += dy * ratio
            remaining_speed = 0


def _find_nearest_production_machine(
    attacker: Attacker,
    cells: dict[tuple[int, int], Cell],
) -> tuple[int, int] | None:
    """
    Find the closest production machine (by Manhattan distance) for this attacker.
    SQL injection probes prefer exposed (undefended) machines.
    """
    targets = [
        pos
        for pos, cell in cells.items()
        if cell.building and cell.building.type in PRODUCTION_TYPES
        and cell.building.health > 0
    ]
    if not targets:
        return None

    ax, ay = int(attacker.x), int(attacker.y)
    return min(targets, key=lambda p: abs(p[0] - ax) + abs(p[1] - ay))


def _calculate_defense_dps(
    coverage: set[BuildingType],
    attacker: Attacker,
) -> int:
    """
    Sum up DPS from all defenses that cover the attacker's current cell.
    Architecture doc table 7.1.
    """
    dps = 0
    for dtype in coverage:
        base_dps = _defense_dps(dtype)
        # Auth middleware deals +200% damage to credential stuffers
        if (
            dtype == BuildingType.AUTH_MIDDLEWARE
            and attacker.attack_type == AttackType.CREDENTIAL_STUFFER
        ):
            dps += base_dps * 3
        else:
            dps += base_dps
    return dps


def _defense_dps(dtype: BuildingType) -> int:
    return {
        BuildingType.RATE_LIMITER: 3,
        BuildingType.WAF: 5,
        BuildingType.AUTH_MIDDLEWARE: 4,
        BuildingType.CIRCUIT_BREAKER: 2,
    }.get(dtype, 0)

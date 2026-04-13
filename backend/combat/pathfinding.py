"""
A* pathfinding for attacker movement on the 20x20 grid.

Standard A* with Manhattan distance heuristic.
Architecture doc section 6.4.

Key rules:
  - Defense buildings are impassable (they block movement entirely).
  - Moving adjacent to a defense costs an extra +5 move penalty.
  - SQL injection probes treat WAF-covered cells as impassable.
  - Credential stuffers pay +10 for auth_middleware-covered cells.
  - Recalculate when defenses change (engine triggers this).
"""
import heapq
from backend.models.enums import BuildingType, AttackType, DEFENSE_TYPES
from backend.models.game_state import Cell
from backend.config import GRID_SIZE

# Movement penalty when adjacent to a defense building
DEFENSE_ADJACENCY_PENALTY = 5

# Extra cost for credential stuffers entering auth_middleware zones
AUTH_MIDDLEWARE_PENALTY = 10


def astar(
    start: tuple[int, int],
    goal: tuple[int, int],
    cells: dict[tuple[int, int], Cell],
    attack_type: AttackType,
    defense_coverage: dict[tuple[int, int], set[BuildingType]],
) -> list[tuple[int, int]] | None:
    """
    Find the shortest path from `start` to `goal` on the grid.

    Parameters
    ----------
    start            : (x, y) spawn position (east edge)
    goal             : (x, y) target production machine
    cells            : full grid cell dictionary
    attack_type      : determines which cells are extra-costly or impassable
    defense_coverage : maps (x, y) -> set of defense BuildingTypes covering it

    Returns
    -------
    list of (x, y) positions from start to goal (inclusive of both ends),
    or None if no path exists.
    """
    # Priority queue entries: (f_score, g_score, position, path_so_far)
    open_heap: list[tuple[float, float, tuple[int, int], list]] = []
    heapq.heappush(open_heap, (0.0, 0.0, start, [start]))

    # Best known g_score for each visited cell
    visited: dict[tuple[int, int], float] = {start: 0.0}

    while open_heap:
        f, g, current, path = heapq.heappop(open_heap)

        # Reached the goal
        if current == goal:
            return path

        # Skip stale entries (we may have updated g_score for this cell)
        if g > visited.get(current, float("inf")):
            continue

        # Expand all 4 cardinal neighbours (no diagonal movement)
        cx, cy = current
        for dx, dy in [(0, -1), (0, 1), (1, 0), (-1, 0)]:
            nx, ny = cx + dx, cy + dy
            neighbour = (nx, ny)

            # Bounds check
            if not (0 <= nx < GRID_SIZE and 0 <= ny < GRID_SIZE):
                continue

            cell = cells.get(neighbour)

            # --- Impassability rules ---
            if cell and cell.building:
                btype = cell.building.type

                # Defense buildings block all movement
                if btype in DEFENSE_TYPES:
                    continue

                # SQL injection probes cannot enter WAF-covered cells
                if (
                    attack_type == AttackType.SQL_INJECTION_PROBE
                    and BuildingType.WAF in defense_coverage.get(neighbour, set())
                ):
                    continue

            # --- Move cost ---
            move_cost = 1.0

            # Extra penalty near defense buildings
            coverage = defense_coverage.get(neighbour, set())
            if coverage:
                move_cost += DEFENSE_ADJACENCY_PENALTY

            # Credential stuffers pay extra in auth_middleware zones
            if (
                attack_type == AttackType.CREDENTIAL_STUFFER
                and BuildingType.AUTH_MIDDLEWARE in coverage
            ):
                move_cost += AUTH_MIDDLEWARE_PENALTY

            new_g = g + move_cost

            # Only process if this is a better path to `neighbour`
            if new_g < visited.get(neighbour, float("inf")):
                visited[neighbour] = new_g
                h = _manhattan(neighbour, goal)
                new_f = new_g + h
                heapq.heappush(
                    open_heap,
                    (new_f, new_g, neighbour, path + [neighbour]),
                )

    # No path found
    return None


def _manhattan(a: tuple[int, int], b: tuple[int, int]) -> float:
    """Manhattan distance heuristic -- admissible for a grid with cost >= 1."""
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def compute_defense_coverage(
    cells: dict[tuple[int, int], Cell],
) -> dict[tuple[int, int], set[BuildingType]]:
    """
    Build a lookup: cell -> set of defense building types that cover it.
    A defense at (x, y) covers all 9 cells in its 3x3 neighbourhood.
    """
    coverage: dict[tuple[int, int], set[BuildingType]] = {}

    for (dx, dy), cell in cells.items():
        if cell.building and cell.building.type in DEFENSE_TYPES:
            dtype = cell.building.type
            # Cover the 3x3 neighbourhood (self + 8 adjacent)
            for ox in range(-1, 2):
                for oy in range(-1, 2):
                    nx, ny = dx + ox, dy + oy
                    if 0 <= nx < GRID_SIZE and 0 <= ny < GRID_SIZE:
                        coverage.setdefault((nx, ny), set()).add(dtype)

    return coverage

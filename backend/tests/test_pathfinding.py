"""Unit tests for A* pathfinding."""
import pytest
from backend.engine.grid import build_initial_grid, parse_grid
from backend.combat.pathfinding import astar, compute_defense_coverage, _manhattan
from backend.models.enums import BuildingType, AttackType, Direction
from backend.models.game_state import Building


def make_grid():
    return parse_grid(build_initial_grid())


def test_astar_finds_path_on_empty_grid():
    grid = make_grid()
    coverage = compute_defense_coverage(grid)
    path = astar((19, 5), (0, 5), grid, AttackType.DDOS_BOT, coverage)
    assert path is not None
    assert path[0] == (19, 5)
    assert path[-1] == (0, 5)


def test_astar_returns_none_when_blocked():
    grid = make_grid()
    # Wall of defenses blocking all rows
    for y in range(20):
        grid[(10, y)].building = Building(
            type=BuildingType.WAF, direction=Direction.EAST
        )
    coverage = compute_defense_coverage(grid)
    path = astar((19, 5), (0, 5), grid, AttackType.DDOS_BOT, coverage)
    assert path is None


def test_astar_avoids_defenses():
    grid = make_grid()
    # Place a WAF at (10, 5)
    grid[(10, 5)].building = Building(type=BuildingType.WAF, direction=Direction.EAST)
    coverage = compute_defense_coverage(grid)
    path = astar((19, 5), (0, 5), grid, AttackType.DDOS_BOT, coverage)
    assert path is not None
    # Path should not go through (10, 5)
    assert (10, 5) not in path


def test_sql_injection_probe_avoids_waf_covered_cells():
    grid = make_grid()
    # WAF at (10, 10) covers (9-11, 9-11)
    grid[(10, 10)].building = Building(type=BuildingType.WAF, direction=Direction.EAST)
    coverage = compute_defense_coverage(grid)
    # SQL probe trying to reach (0, 10) from (19, 10)
    path = astar((19, 10), (0, 10), grid, AttackType.SQL_INJECTION_PROBE, coverage)
    # Path must avoid all WAF-covered cells
    if path:
        waf_cells = {(x, y) for (x, y) in coverage if BuildingType.WAF in coverage[(x, y)]}
        for step in path[1:]:  # skip start
            assert step not in waf_cells or step == (0, 10)


def test_manhattan_heuristic():
    assert _manhattan((0, 0), (3, 4)) == 7
    assert _manhattan((5, 5), (5, 5)) == 0
    assert _manhattan((10, 0), (0, 10)) == 20


def test_defense_coverage_3x3():
    grid = make_grid()
    grid[(5, 5)].building = Building(type=BuildingType.RATE_LIMITER, direction=Direction.EAST)
    coverage = compute_defense_coverage(grid)
    # All 9 cells in 3x3 around (5,5) should be covered
    for dx in range(-1, 2):
        for dy in range(-1, 2):
            pos = (5 + dx, 5 + dy)
            assert pos in coverage
            assert BuildingType.RATE_LIMITER in coverage[pos]


def test_astar_path_is_connected():
    grid = make_grid()
    coverage = compute_defense_coverage(grid)
    path = astar((19, 0), (0, 0), grid, AttackType.DDOS_BOT, coverage)
    assert path is not None
    for i in range(1, len(path)):
        px, py = path[i - 1]
        cx, cy = path[i]
        # Each step is exactly 1 cell apart (no diagonals)
        assert abs(px - cx) + abs(py - cy) == 1

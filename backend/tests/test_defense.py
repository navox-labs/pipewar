"""Unit tests for defense system."""
import pytest
from backend.engine.grid import build_initial_grid, parse_grid
from backend.combat.pathfinding import compute_defense_coverage
from backend.combat.defense import find_exposed_machines, slow_ddos_bots
from backend.combat.attacker import spawn_attacker, ATTACKER_STATS
from backend.models.enums import BuildingType, Direction, AttackType
from backend.models.game_state import Building, Attacker


def make_grid():
    return parse_grid(build_initial_grid())


def test_exposed_machine_detected_without_defense():
    grid = make_grid()
    # Place a smelter with no defense nearby
    grid[(10, 10)].building = Building(type=BuildingType.SMELTER, direction=Direction.EAST)
    coverage = compute_defense_coverage(grid)
    exposed = find_exposed_machines(grid, coverage)
    assert (10, 10) in exposed


def test_machine_not_exposed_when_in_defense_zone():
    grid = make_grid()
    grid[(10, 10)].building = Building(type=BuildingType.SMELTER, direction=Direction.EAST)
    grid[(10, 11)].building = Building(type=BuildingType.WAF, direction=Direction.EAST)
    coverage = compute_defense_coverage(grid)
    exposed = find_exposed_machines(grid, coverage)
    assert (10, 10) not in exposed


def test_ddos_bot_slowed_in_rate_limiter_zone():
    grid = make_grid()
    grid[(5, 5)].building = Building(type=BuildingType.RATE_LIMITER, direction=Direction.EAST)
    coverage = compute_defense_coverage(grid)
    attacker = Attacker(
        id="test",
        attack_type=AttackType.DDOS_BOT,
        x=5.0, y=5.0,
        hp=30, max_hp=30,
        speed=ATTACKER_STATS[AttackType.DDOS_BOT]["speed"],
        damage_per_tick=2,
    )
    slow_ddos_bots([attacker], coverage)
    base = ATTACKER_STATS[AttackType.DDOS_BOT]["speed"]
    assert abs(attacker.speed - base * 0.5) < 1e-9


def test_ddos_bot_not_slowed_outside_zone():
    grid = make_grid()
    coverage = compute_defense_coverage(grid)
    attacker = Attacker(
        id="test",
        attack_type=AttackType.DDOS_BOT,
        x=10.0, y=10.0,
        hp=30, max_hp=30,
        speed=ATTACKER_STATS[AttackType.DDOS_BOT]["speed"],
        damage_per_tick=2,
    )
    slow_ddos_bots([attacker], coverage)
    base = ATTACKER_STATS[AttackType.DDOS_BOT]["speed"]
    assert abs(attacker.speed - base) < 1e-9


def test_non_ddos_not_affected_by_slow():
    grid = make_grid()
    grid[(5, 5)].building = Building(type=BuildingType.RATE_LIMITER, direction=Direction.EAST)
    coverage = compute_defense_coverage(grid)
    attacker = Attacker(
        id="test",
        attack_type=AttackType.CREDENTIAL_STUFFER,
        x=5.0, y=5.0,
        hp=60, max_hp=60,
        speed=ATTACKER_STATS[AttackType.CREDENTIAL_STUFFER]["speed"],
        damage_per_tick=5,
    )
    original_speed = attacker.speed
    slow_ddos_bots([attacker], coverage)
    assert attacker.speed == original_speed

"""Pytest configuration and shared fixtures."""
import pytest
import asyncio
from backend.engine.grid import build_initial_grid, parse_grid
from backend.models.enums import BuildingType, Direction, AttackType
from backend.models.game_state import Cell, Building, Resource, Attacker
from backend.config import GRID_SIZE


@pytest.fixture
def empty_grid():
    """20x20 grid with only resource tiles."""
    state = build_initial_grid()
    return parse_grid(state)


@pytest.fixture
def grid_with_miner(empty_grid):
    """Grid with a miner placed on iron ore at (0,5)."""
    empty_grid[(0, 5)].building = Building(
        type=BuildingType.MINER,
        direction=Direction.EAST,
    )
    return empty_grid


@pytest.fixture
def simple_ddos_attacker():
    return Attacker(
        id="test-1",
        attack_type=AttackType.DDOS_BOT,
        x=19.0,
        y=5.0,
        hp=30,
        max_hp=30,
        speed=0.15,
        damage_per_tick=2,
    )

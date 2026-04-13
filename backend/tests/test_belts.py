"""Unit tests for belt item movement."""
import pytest
from backend.engine.grid import build_initial_grid, parse_grid
from backend.engine.belts import tick_belts, place_item_on_belt, MAX_BELT_ITEMS, BELT_SPEED
from backend.models.enums import BuildingType, Direction, ItemType
from backend.models.game_state import Building, BeltItem


def make_grid():
    return parse_grid(build_initial_grid())


def test_belt_item_advances_each_tick():
    grid = make_grid()
    belt = Building(type=BuildingType.BELT, direction=Direction.EAST)
    belt.belt_items.append(BeltItem(item_type=ItemType.IRON_ORE, position=0.0))
    grid[(5, 5)].building = belt
    tick_belts(grid)
    assert abs(belt.belt_items[0].position - BELT_SPEED) < 1e-6


def test_belt_item_transfers_to_next_belt():
    grid = make_grid()
    belt1 = Building(type=BuildingType.BELT, direction=Direction.EAST)
    belt2 = Building(type=BuildingType.BELT, direction=Direction.EAST)
    belt1.belt_items.append(BeltItem(item_type=ItemType.IRON_ORE, position=0.95))
    grid[(5, 5)].building = belt1
    grid[(6, 5)].building = belt2
    tick_belts(grid)
    # Item should have transferred to belt2
    assert len(belt1.belt_items) == 0
    assert len(belt2.belt_items) == 1
    # Item is placed at 0.0 and then immediately advanced by BELT_SPEED in same tick
    assert abs(belt2.belt_items[0].position - BELT_SPEED) <= BELT_SPEED + 1e-6


def test_belt_item_stalls_when_next_belt_full():
    grid = make_grid()
    belt1 = Building(type=BuildingType.BELT, direction=Direction.EAST)
    belt2 = Building(type=BuildingType.BELT, direction=Direction.EAST)
    belt1.belt_items.append(BeltItem(item_type=ItemType.IRON_ORE, position=0.95))
    for _ in range(MAX_BELT_ITEMS):
        belt2.belt_items.append(BeltItem(item_type=ItemType.IRON_ORE, position=0.5))
    grid[(5, 5)].building = belt1
    grid[(6, 5)].building = belt2
    tick_belts(grid)
    # Item stalls at 1.0 on belt1
    assert len(belt1.belt_items) == 1
    assert belt1.belt_items[0].position == 1.0


def test_place_item_on_belt_respects_capacity():
    belt = Building(type=BuildingType.BELT, direction=Direction.EAST)
    for _ in range(MAX_BELT_ITEMS):
        ok = place_item_on_belt(belt, ItemType.IRON_ORE)
        assert ok is True
    # Fourth item should be rejected
    ok = place_item_on_belt(belt, ItemType.IRON_ORE)
    assert ok is False


def test_belt_item_transfers_to_machine_input():
    grid = make_grid()
    from backend.models.game_state import Building as B
    belt = Building(type=BuildingType.BELT, direction=Direction.EAST)
    belt.belt_items.append(BeltItem(item_type=ItemType.IRON_ORE, position=0.9))
    smelter = Building(type=BuildingType.SMELTER, direction=Direction.EAST)
    grid[(5, 5)].building = belt
    grid[(6, 5)].building = smelter
    tick_belts(grid)
    assert smelter.input_buffer.get("iron_ore", 0) == 1
    assert len(belt.belt_items) == 0


def test_vertical_belt_item_moves_south():
    grid = make_grid()
    belt = Building(type=BuildingType.BELT, direction=Direction.SOUTH)
    belt.belt_items.append(BeltItem(item_type=ItemType.COPPER_ORE, position=0.0))
    grid[(5, 5)].building = belt
    tick_belts(grid)
    assert abs(belt.belt_items[0].position - BELT_SPEED) < 1e-6

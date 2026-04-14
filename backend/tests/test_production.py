"""Unit tests for production machine logic."""
import pytest
from backend.engine.grid import build_initial_grid, parse_grid
from backend.engine.production import tick_machine, _push_outputs, _pull_inputs
from backend.models.enums import BuildingType, Direction, ItemType
from backend.models.game_state import Building, Cell, BeltItem


def make_grid():
    return parse_grid(build_initial_grid())


def test_miner_starts_processing_on_resource_tile():
    grid = make_grid()
    grid[(0, 5)].building = Building(type=BuildingType.MINER, direction=Direction.EAST)
    cell = grid[(0, 5)]
    # First tick: starts processing (sets ticks_remaining = 10)
    result = tick_machine(cell, grid)
    assert cell.building.processing_ticks_remaining == 10


def test_miner_produces_iron_ore_after_10_ticks():
    grid = make_grid()
    grid[(0, 5)].building = Building(type=BuildingType.MINER, direction=Direction.EAST)
    cell = grid[(0, 5)]
    # Run 11 ticks: start processing on tick 1, complete on tick 11
    for _ in range(11):
        tick_machine(cell, grid)
    assert "iron_plate" not in cell.building.output_buffer
    # Should have started the 2nd cycle; output_buffer may have iron_ore
    # After 11 ticks: first ore in output buffer after tick 11
    assert cell.building.output_buffer.get("iron_ore", 0) >= 1


def test_miner_on_copper_tile_produces_copper_ore():
    grid = make_grid()
    grid[(0, 0)].building = Building(type=BuildingType.MINER, direction=Direction.EAST)
    cell = grid[(0, 0)]
    for _ in range(11):
        tick_machine(cell, grid)
    assert cell.building.output_buffer.get("copper_ore", 0) >= 1


def test_smelter_converts_iron_ore_to_plate():
    grid = make_grid()
    smelter = Building(type=BuildingType.SMELTER, direction=Direction.EAST)
    smelter.input_buffer["iron_ore"] = 1
    grid[(5, 5)].building = smelter
    cell = grid[(5, 5)]
    # Tick 1: start recipe (processing_ticks = 20)
    tick_machine(cell, grid)
    assert smelter.processing_ticks_remaining == 20
    # Run 20 more ticks to complete
    for _ in range(20):
        tick_machine(cell, grid)
    assert smelter.output_buffer.get("iron_plate", 0) >= 1


def test_smelter_stalls_when_output_buffer_full():
    grid = make_grid()
    smelter = Building(type=BuildingType.SMELTER, direction=Direction.EAST)
    smelter.input_buffer["iron_ore"] = 5
    smelter.output_buffer["iron_plate"] = 5  # at capacity
    grid[(5, 5)].building = smelter
    cell = grid[(5, 5)]
    # Should stall -- no processing
    tick_machine(cell, grid)
    assert smelter.processing_ticks_remaining == 0


def test_assembler_copper_plate_to_wire():
    grid = make_grid()
    asm = Building(type=BuildingType.ASSEMBLER, direction=Direction.EAST)
    asm.input_buffer["copper_plate"] = 1
    grid[(5, 5)].building = asm
    cell = grid[(5, 5)]
    tick_machine(cell, grid)
    assert asm.processing_ticks_remaining == 15
    for _ in range(15):
        tick_machine(cell, grid)
    assert asm.output_buffer.get("copper_wire", 0) >= 2


def test_assembler_green_circuit_recipe():
    grid = make_grid()
    asm = Building(type=BuildingType.ASSEMBLER, direction=Direction.EAST)
    asm.input_buffer["iron_plate"] = 1
    asm.input_buffer["copper_wire"] = 3
    grid[(5, 5)].building = asm
    cell = grid[(5, 5)]
    tick_machine(cell, grid)
    assert asm.processing_ticks_remaining == 30
    for _ in range(30):
        tick_machine(cell, grid)
    assert asm.output_buffer.get("green_circuit", 0) >= 1


def test_assembler_advanced_circuit_recipe():
    grid = make_grid()
    asm = Building(type=BuildingType.ASSEMBLER, direction=Direction.EAST)
    asm.input_buffer["green_circuit"] = 2
    grid[(5, 5)].building = asm
    cell = grid[(5, 5)]
    tick_machine(cell, grid)
    assert asm.processing_ticks_remaining == 60
    for _ in range(60):
        result = tick_machine(cell, grid)
    # advanced circuits are counted by return value
    assert asm.output_buffer.get("advanced_circuit", 0) >= 1


def test_machine_does_not_produce_when_health_zero():
    grid = make_grid()
    grid[(0, 5)].building = Building(type=BuildingType.MINER, direction=Direction.EAST)
    grid[(0, 5)].building.health = 0
    cell = grid[(0, 5)]
    result = tick_machine(cell, grid)
    assert result == 0
    assert cell.building.processing_ticks_remaining == 0


def test_push_outputs_miner_to_adjacent_belt():
    grid = make_grid()
    miner = Building(type=BuildingType.MINER, direction=Direction.EAST)
    miner.output_buffer["iron_ore"] = 2
    grid[(5, 5)].building = miner
    belt = Building(type=BuildingType.BELT, direction=Direction.EAST)
    grid[(6, 5)].building = belt
    _push_outputs(grid[(5, 5)], grid)
    assert miner.output_buffer.get("iron_ore", 0) == 1
    assert len(belt.belt_items) == 1
    assert belt.belt_items[0].item_type == ItemType.IRON_ORE


def test_push_outputs_miner_no_push_when_belt_full():
    from backend.engine.belts import MAX_BELT_ITEMS
    grid = make_grid()
    miner = Building(type=BuildingType.MINER, direction=Direction.EAST)
    miner.output_buffer["iron_ore"] = 1
    grid[(5, 5)].building = miner
    belt = Building(type=BuildingType.BELT, direction=Direction.EAST)
    for _ in range(MAX_BELT_ITEMS):
        belt.belt_items.append(BeltItem(item_type=ItemType.IRON_ORE, position=0.5))
    grid[(6, 5)].building = belt
    _push_outputs(grid[(5, 5)], grid)
    assert miner.output_buffer.get("iron_ore", 0) == 1


def test_push_outputs_noop_for_non_miner():
    grid = make_grid()
    smelter = Building(type=BuildingType.SMELTER, direction=Direction.EAST)
    smelter.output_buffer["iron_plate"] = 1
    grid[(5, 5)].building = smelter
    belt = Building(type=BuildingType.BELT, direction=Direction.EAST)
    grid[(6, 5)].building = belt
    _push_outputs(grid[(5, 5)], grid)
    assert len(belt.belt_items) == 0


def test_pull_inputs_checks_all_four_neighbours():
    """Bug #4: break was changed to continue so all 4 neighbours are checked."""
    grid = make_grid()
    asm = Building(type=BuildingType.ASSEMBLER, direction=Direction.EAST)
    grid[(5, 5)].building = asm

    # Place two production machines adjacent with different outputs
    smelter_north = Building(type=BuildingType.SMELTER, direction=Direction.SOUTH)
    smelter_north.output_buffer["iron_plate"] = 1
    grid[(5, 4)].building = smelter_north

    smelter_west = Building(type=BuildingType.SMELTER, direction=Direction.EAST)
    smelter_west.output_buffer["copper_wire"] = 1
    grid[(4, 5)].building = smelter_west

    _pull_inputs(grid[(5, 5)], grid)
    # Both items should be pulled in (not just the first one)
    assert asm.input_buffer.get("iron_plate", 0) == 1
    assert asm.input_buffer.get("copper_wire", 0) == 1

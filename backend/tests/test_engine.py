"""Unit tests for the game engine (uptime, end conditions, building placement)."""
import pytest
from backend.engine.game_engine import GameEngine
from backend.engine.grid import build_initial_grid
from backend.models.enums import BuildingType, Direction


def make_engine():
    return GameEngine(
        game_id="test-game",
        grid_state=build_initial_grid(),
    )


def test_initial_uptime_is_100():
    engine = make_engine()
    assert engine._uptime_pct() == 100.0


def test_uptime_decreases_with_downtime():
    engine = make_engine()
    engine.total_ticks = 100
    engine.downtime_ticks = 5
    uptime = engine._uptime_pct()
    assert abs(uptime - 95.0) < 1e-6


def test_place_building_on_empty_cell():
    engine = make_engine()
    err = engine.place_building(5, 5, BuildingType.SMELTER, Direction.EAST)
    assert err is None
    assert engine.grid[(5, 5)].building is not None
    assert engine.grid[(5, 5)].building.type == BuildingType.SMELTER


def test_place_building_on_occupied_cell():
    engine = make_engine()
    engine.place_building(5, 5, BuildingType.SMELTER, Direction.EAST)
    err = engine.place_building(5, 5, BuildingType.ASSEMBLER, Direction.EAST)
    assert err is not None  # "Cell is occupied"


def test_place_miner_on_resource_tile():
    engine = make_engine()
    err = engine.place_building(0, 5, BuildingType.MINER, Direction.EAST)
    assert err is None


def test_place_non_miner_on_resource_tile_fails():
    engine = make_engine()
    err = engine.place_building(0, 5, BuildingType.SMELTER, Direction.EAST)
    assert err is not None


def test_remove_building():
    engine = make_engine()
    engine.place_building(5, 5, BuildingType.SMELTER, Direction.EAST)
    err = engine.remove_building(5, 5)
    assert err is None
    assert engine.grid[(5, 5)].building is None


def test_remove_nonexistent_building():
    engine = make_engine()
    err = engine.remove_building(5, 5)
    assert err is not None


def test_rotate_building():
    engine = make_engine()
    engine.place_building(5, 5, BuildingType.BELT, Direction.EAST)
    err = engine.rotate_building(5, 5, Direction.NORTH)
    assert err is None
    assert engine.grid[(5, 5)].building.direction == Direction.NORTH


def test_defense_placement_marks_coverage_dirty():
    engine = make_engine()
    engine._coverage_dirty = False
    engine.place_building(5, 5, BuildingType.WAF, Direction.EAST)
    assert engine._coverage_dirty is True


def test_get_state_snapshot_structure():
    engine = make_engine()
    snapshot = engine.get_state_snapshot()
    assert snapshot["type"] == "state_sync"
    assert "grid" in snapshot
    assert "advanced_circuits" in snapshot
    assert "uptime_pct" in snapshot

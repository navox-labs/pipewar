"""Unit tests for Pydantic schema validation (C-04)."""
import pytest
from pydantic import ValidationError
from backend.models.schemas import parse_client_message


def test_place_building_valid():
    msg = parse_client_message({
        "type": "place_building",
        "x": 5,
        "y": 10,
        "building_type": "smelter",
        "direction": "east",
    })
    assert msg.type == "place_building"
    assert msg.x == 5


def test_place_building_out_of_bounds_x():
    with pytest.raises((ValidationError, ValueError)):
        parse_client_message({
            "type": "place_building",
            "x": 25,  # out of bounds
            "y": 5,
            "building_type": "smelter",
            "direction": "east",
        })


def test_place_building_out_of_bounds_y():
    with pytest.raises((ValidationError, ValueError)):
        parse_client_message({
            "type": "place_building",
            "x": 5,
            "y": -1,  # out of bounds
            "building_type": "smelter",
            "direction": "east",
        })


def test_place_building_invalid_type():
    with pytest.raises((ValidationError, ValueError)):
        parse_client_message({
            "type": "place_building",
            "x": 5,
            "y": 5,
            "building_type": "rocket_launcher",  # not a valid type
            "direction": "east",
        })


def test_place_building_invalid_direction():
    with pytest.raises((ValidationError, ValueError)):
        parse_client_message({
            "type": "place_building",
            "x": 5,
            "y": 5,
            "building_type": "smelter",
            "direction": "diagonal",  # invalid
        })


def test_remove_building_valid():
    msg = parse_client_message({
        "type": "remove_building",
        "x": 0,
        "y": 19,
    })
    assert msg.type == "remove_building"


def test_toggle_pause_valid():
    msg = parse_client_message({"type": "toggle_pause"})
    assert msg.type == "toggle_pause"


def test_unknown_message_type():
    with pytest.raises((ValidationError, ValueError)):
        parse_client_message({"type": "hack_the_planet"})


def test_rotate_building_valid():
    msg = parse_client_message({
        "type": "rotate_building",
        "x": 5,
        "y": 5,
        "direction": "north",
    })
    assert msg.type == "rotate_building"

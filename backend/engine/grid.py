"""
Grid initialisation and serialization helpers.
Initial resource positions: architecture doc section 13.
"""
from backend.config import GRID_SIZE, IRON_ORE_TILES, COPPER_ORE_TILES, INITIAL_ORE_AMOUNT
from backend.models.game_state import Cell, Resource, Building, BeltItem
from backend.models.enums import ItemType, BuildingType, Direction


def build_initial_grid() -> dict:
    """
    Return the JSON-serialisable grid_state dict for a brand new game.
    Only resource tiles are pre-populated; buildings start empty.
    """
    resources = {}
    for x, y in IRON_ORE_TILES:
        resources[f"{x},{y}"] = {"type": "iron_ore", "remaining": INITIAL_ORE_AMOUNT}
    for x, y in COPPER_ORE_TILES:
        resources[f"{x},{y}"] = {"type": "copper_ore", "remaining": INITIAL_ORE_AMOUNT}
    return {"buildings": {}, "defenses": {}, "resources": resources}


def parse_grid(grid_state: dict) -> dict[tuple[int, int], Cell]:
    """
    Deserialise the stored grid_state JSON into in-memory Cell objects
    used by the game engine.
    """
    cells: dict[tuple[int, int], Cell] = {}

    # Pre-populate all cells as empty
    for x in range(GRID_SIZE):
        for y in range(GRID_SIZE):
            cells[(x, y)] = Cell(x=x, y=y)

    # Resources
    for key, rdata in grid_state.get("resources", {}).items():
        x, y = _parse_key(key)
        cells[(x, y)].resource = Resource(
            item_type=ItemType(rdata["type"]),
            remaining=rdata.get("remaining", INITIAL_ORE_AMOUNT),
        )

    # Buildings (production + belt)
    for key, bdata in grid_state.get("buildings", {}).items():
        x, y = _parse_key(key)
        btype = BuildingType(bdata["type"])
        direction = Direction(bdata.get("direction", "east"))
        b = Building(
            type=btype,
            direction=direction,
            health=bdata.get("health", 100),
            input_buffer=dict(bdata.get("input_buffer", {})),
            output_buffer=dict(bdata.get("output_buffer", {})),
            processing_ticks_remaining=bdata.get("processing_ticks_remaining", 0),
            items_produced=bdata.get("items_produced", 0),
        )
        # Restore belt items
        for item_data in bdata.get("items", []):
            b.belt_items.append(
                BeltItem(
                    item_type=ItemType(item_data["type"]),
                    position=item_data["position"],
                )
            )
        cells[(x, y)].building = b

    # Defenses (stored separately in grid_state)
    for key, ddata in grid_state.get("defenses", {}).items():
        x, y = _parse_key(key)
        btype = BuildingType(ddata["type"])
        b = Building(
            type=btype,
            direction=Direction.EAST,
            health=ddata.get("health", 100),
        )
        cells[(x, y)].building = b

    return cells


def serialize_grid(cells: dict[tuple[int, int], Cell]) -> dict:
    """
    Convert in-memory cells back to JSON-serialisable grid_state dict.
    """
    buildings = {}
    defenses = {}
    resources = {}

    for (x, y), cell in cells.items():
        if cell.resource:
            resources[f"{x},{y}"] = {
                "type": cell.resource.item_type.value,
                "remaining": cell.resource.remaining,
            }
        if cell.building:
            b = cell.building
            from backend.models.enums import DEFENSE_TYPES
            key = f"{x},{y}"
            if b.type in DEFENSE_TYPES:
                defenses[key] = {
                    "type": b.type.value,
                    "health": b.health,
                    "active": b.health > 0,
                }
            else:
                entry: dict = {
                    "type": b.type.value,
                    "direction": b.direction.value,
                    "health": b.health,
                    "input_buffer": b.input_buffer,
                    "output_buffer": b.output_buffer,
                    "processing_ticks_remaining": b.processing_ticks_remaining,
                    "items_produced": b.items_produced,
                }
                if b.type == BuildingType.BELT:
                    entry["items"] = [
                        {"type": it.item_type.value, "position": it.position}
                        for it in b.belt_items
                    ]
                buildings[key] = entry

    return {"buildings": buildings, "defenses": defenses, "resources": resources}


def _parse_key(key: str) -> tuple[int, int]:
    parts = key.split(",")
    return int(parts[0]), int(parts[1])


def direction_delta(direction: Direction) -> tuple[int, int]:
    """Return (dx, dy) for a given direction."""
    return {
        Direction.NORTH: (0, -1),
        Direction.SOUTH: (0, 1),
        Direction.EAST:  (1, 0),
        Direction.WEST:  (-1, 0),
    }[direction]

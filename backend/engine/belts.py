"""
Belt tick logic.
Belt behaviour from architecture doc section 4.3.
"""
from backend.models.enums import BuildingType, Direction, PRODUCTION_TYPES
from backend.models.game_state import Cell, BeltItem
from backend.engine.grid import direction_delta
from backend.config import GRID_SIZE

BELT_SPEED = 0.1          # units per tick
MAX_BELT_ITEMS = 3


def tick_belts(cells: dict[tuple[int, int], Cell]):
    """
    Process one tick of belt movement across all belt cells.
    Items advance by BELT_SPEED units. When position >= 1.0 we try to
    transfer to the next cell.
    """
    # Collect all belt cells so we can iterate without mutation issues
    belt_cells = [
        (pos, cell) for pos, cell in cells.items()
        if cell.building and cell.building.type == BuildingType.BELT
    ]

    # Sort by position along belt direction (process furthest-along items first
    # to avoid chain-blocking within the same tick)
    for pos, cell in belt_cells:
        b = cell.building
        dx, dy = direction_delta(b.direction)
        next_pos = (pos[0] + dx, pos[1] + dy)
        next_cell = cells.get(next_pos)

        # Move all items forward
        items_to_transfer = []
        for item in list(b.belt_items):
            item.position = min(item.position + BELT_SPEED, 1.0)
            if item.position >= 1.0:
                items_to_transfer.append(item)

        # Attempt transfer for items at exit
        for item in items_to_transfer:
            transferred = _try_transfer(item, b, next_cell, next_pos)
            if transferred:
                b.belt_items.remove(item)
            # else: item stalls at position 1.0


def _try_transfer(
    item: BeltItem,
    current_belt: 'Building',
    next_cell: Cell | None,
    next_pos: tuple[int, int],
) -> bool:
    """
    Try to move `item` from the current belt to the next cell.
    Returns True if transferred, False if stalled.
    """
    if next_cell is None:
        return False

    nb = next_cell.building
    if nb is None:
        return False

    if nb.type == BuildingType.BELT:
        # Transfer to next belt if not full
        if len(nb.belt_items) < MAX_BELT_ITEMS:
            nb.belt_items.append(BeltItem(item_type=item.item_type, position=0.0))
            return True
        return False

    if nb.type in PRODUCTION_TYPES:
        # Try to add to machine input_buffer
        from backend.engine.production import INPUT_BUFFER_CAPACITY
        total_input = sum(
            v for k, v in nb.input_buffer.items()
            if not k.startswith("__")
        )
        if total_input < INPUT_BUFFER_CAPACITY:
            key = item.item_type.value
            nb.input_buffer[key] = nb.input_buffer.get(key, 0) + 1
            return True
        return False

    return False


def place_item_on_belt(
    belt_building: 'Building',
    item_type,
) -> bool:
    """
    Place an item at the start (position=0.0) of a belt if space permits.
    """
    if len(belt_building.belt_items) >= MAX_BELT_ITEMS:
        return False
    belt_building.belt_items.append(BeltItem(item_type=item_type, position=0.0))
    return True

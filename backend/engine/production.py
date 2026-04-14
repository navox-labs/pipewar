"""
Production machine tick logic.
Recipes from architecture doc section 4.1.
Machine behaviour from section 4.2.
"""
from backend.models.enums import BuildingType, ItemType, Direction, PRODUCTION_TYPES
from backend.models.game_state import Building, Cell
from backend.engine.grid import direction_delta
from backend.config import GRID_SIZE

# ---------------------------------------------------------------------------
# Recipe definitions
# ---------------------------------------------------------------------------
# Each recipe: (inputs: {ItemType: count}, output_type: ItemType, output_count: int, ticks: int)
RECIPES: dict[str, list[tuple[dict, ItemType, int, int]]] = {
    BuildingType.MINER: [
        ({}, ItemType.IRON_ORE, 1, 10),  # ore type determined at runtime
    ],
    BuildingType.SMELTER: [
        ({ItemType.IRON_ORE: 1}, ItemType.IRON_PLATE, 1, 20),
        ({ItemType.COPPER_ORE: 1}, ItemType.COPPER_PLATE, 1, 20),
    ],
    BuildingType.ASSEMBLER: [
        ({ItemType.COPPER_PLATE: 1}, ItemType.COPPER_WIRE, 2, 15),
        ({ItemType.IRON_PLATE: 1, ItemType.COPPER_WIRE: 3}, ItemType.GREEN_CIRCUIT, 1, 30),
        ({ItemType.GREEN_CIRCUIT: 2}, ItemType.ADVANCED_CIRCUIT, 1, 60),
    ],
}

OUTPUT_BUFFER_CAPACITY = 5
INPUT_BUFFER_CAPACITY = 10


def tick_machine(
    cell: Cell,
    cells: dict[tuple[int, int], Cell],
) -> int:
    """
    Run one tick of logic for a production machine.
    Returns the count of advanced_circuits produced this tick (0 or 1).
    """
    b = cell.building
    if b is None or b.type not in PRODUCTION_TYPES:
        return 0
    if b.health <= 0:
        return 0  # destroyed machine doesn't produce

    advanced_produced = 0

    # --- Step 1: pull inputs from adjacent belt/machine output_buffer ---
    _pull_inputs(cell, cells)

    # --- Step 2: stall if output_buffer is full ---
    total_output = sum(b.output_buffer.values())
    if total_output >= OUTPUT_BUFFER_CAPACITY:
        return 0

    # --- Step 3: if processing, decrement tick counter ---
    if b.processing_ticks_remaining > 0:
        b.processing_ticks_remaining -= 1
        if b.processing_ticks_remaining == 0:
            # Production complete -- move from pending to output buffer
            # We stored the pending output in a special key during recipe start
            pending = b.input_buffer.pop("__pending_output_type__", None)
            pending_count = b.input_buffer.pop("__pending_output_count__", 0)
            if pending:
                otype = pending
                ocount = pending_count
                b.output_buffer[otype] = b.output_buffer.get(otype, 0) + ocount
                b.items_produced += ocount
                b.items_produced_since_last_metric += ocount
                b.has_demand = True
                if otype == ItemType.ADVANCED_CIRCUIT.value:
                    advanced_produced = ocount
        return advanced_produced

    # --- Step 4: try to start a new recipe ---
    recipe = _find_applicable_recipe(b, cell)
    if recipe is None:
        return 0

    inputs, output_type, output_count, ticks = recipe
    # Consume inputs
    for item, qty in inputs.items():
        key = item.value if hasattr(item, 'value') else item
        b.input_buffer[key] = b.input_buffer.get(key, 0) - qty
        if b.input_buffer[key] <= 0:
            del b.input_buffer[key]

    # Special case: miner consumes from resource tile
    if b.type == BuildingType.MINER:
        if cell.resource and cell.resource.remaining > 0:
            cell.resource.remaining -= 1
            output_type = cell.resource.item_type  # iron or copper ore
        else:
            return 0  # no ore left

    # Store pending output (completed when ticks_remaining reaches 0)
    b.input_buffer["__pending_output_type__"] = output_type.value if hasattr(output_type, 'value') else output_type
    b.input_buffer["__pending_output_count__"] = output_count
    b.processing_ticks_remaining = ticks
    b.has_demand = True

    return 0


def _find_applicable_recipe(
    b: Building,
    cell: Cell,
) -> tuple | None:
    """
    Find the first recipe for this machine type whose input requirements
    are satisfied by the current input_buffer.
    """
    btype = b.type
    if btype not in RECIPES:
        return None

    for recipe in RECIPES[btype]:
        inputs, output_type, output_count, ticks = recipe
        if btype == BuildingType.MINER:
            # Miner just needs a resource tile beneath it
            if cell.resource and cell.resource.remaining > 0:
                return recipe
            continue
        # Check all required inputs are present
        satisfied = True
        for item_type, qty in inputs.items():
            key = item_type.value if hasattr(item_type, 'value') else item_type
            if b.input_buffer.get(key, 0) < qty:
                satisfied = False
                break
        if satisfied:
            return recipe

    return None


def _pull_inputs(cell: Cell, cells: dict[tuple[int, int], Cell]):
    """
    Pull items from adjacent cells (belts/machines that output to this machine).
    A machine pulls from the cell facing its input side.
    For simplicity: any adjacent cell with compatible output can feed this machine.
    """
    b = cell.building
    # Miners produce from resource tiles, they never need to pull inputs
    if b.type == BuildingType.MINER:
        return
    total_input = sum(
        v for k, v in b.input_buffer.items()
        if not k.startswith("__")
    )
    if total_input >= INPUT_BUFFER_CAPACITY:
        return

    # Check all 4 neighbours
    for dx, dy in [(0, -1), (0, 1), (1, 0), (-1, 0)]:
        nx, ny = cell.x + dx, cell.y + dy
        if not (0 <= nx < GRID_SIZE and 0 <= ny < GRID_SIZE):
            continue
        neighbour = cells.get((nx, ny))
        if neighbour is None or neighbour.building is None:
            continue
        nb = neighbour.building

        # Only pull from belt output or machine output buffer
        if nb.type == BuildingType.BELT:
            _pull_from_belt(b, nb, dx, dy)
        elif nb.type in PRODUCTION_TYPES and nb.output_buffer:
            # Pull one item from neighbour's output buffer
            for item_key, qty in list(nb.output_buffer.items()):
                if qty > 0 and not item_key.startswith("__"):
                    nb.output_buffer[item_key] -= 1
                    if nb.output_buffer[item_key] == 0:
                        del nb.output_buffer[item_key]
                    b.input_buffer[item_key] = b.input_buffer.get(item_key, 0) + 1
                    break  # pull one item per neighbour per tick
            continue


def _push_outputs(cell: Cell, cells: dict[tuple[int, int], Cell]):
    """Push items from output_buffer onto the adjacent belt or machine in the building's facing direction."""
    b = cell.building
    if b.type not in PRODUCTION_TYPES:
        return
    if not b.output_buffer:
        return
    dx, dy = direction_delta(b.direction)
    nx, ny = cell.x + dx, cell.y + dy
    if not (0 <= nx < GRID_SIZE and 0 <= ny < GRID_SIZE):
        return
    neighbour = cells.get((nx, ny))
    if neighbour is None or neighbour.building is None:
        return
    nb = neighbour.building
    for item_key, qty in list(b.output_buffer.items()):
        if qty <= 0 or item_key.startswith("__"):
            continue
        if nb.type == BuildingType.BELT:
            from backend.engine.belts import MAX_BELT_ITEMS
            from backend.models.game_state import BeltItem
            if len(nb.belt_items) < MAX_BELT_ITEMS:
                nb.belt_items.append(BeltItem(item_type=ItemType(item_key), position=0.0))
                b.output_buffer[item_key] -= 1
                if b.output_buffer[item_key] <= 0:
                    del b.output_buffer[item_key]
                break
        elif nb.type in PRODUCTION_TYPES:
            total_input = sum(v for k, v in nb.input_buffer.items() if not k.startswith("__"))
            if total_input < INPUT_BUFFER_CAPACITY:
                nb.input_buffer[item_key] = nb.input_buffer.get(item_key, 0) + 1
                b.output_buffer[item_key] -= 1
                if b.output_buffer[item_key] <= 0:
                    del b.output_buffer[item_key]
                break


def _pull_from_belt(machine: Building, belt: Building, dx: int, dy: int):
    """
    Pull an item off the end of a belt (position >= 0.9) into the machine's input buffer.
    Only pull if belt is oriented to deliver to this machine direction.
    """
    # Find items near the exit end of the belt (position >= 0.8)
    ready = [it for it in belt.belt_items if it.position >= 0.8]
    if not ready:
        return
    # Take the furthest item
    item = max(ready, key=lambda i: i.position)
    belt.belt_items.remove(item)
    key = item.item_type.value
    machine.input_buffer[key] = machine.input_buffer.get(key, 0) + 1

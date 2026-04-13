"""
Metrics and bottleneck detection.
Architecture doc section 5.3.
"""
from backend.models.game_state import Cell, MachineMetrics
from backend.models.enums import PRODUCTION_TYPES, BuildingType


def compute_metrics(
    cells: dict[tuple[int, int], Cell],
    metrics: dict[tuple[int, int], MachineMetrics],
) -> float:
    """
    Compute per-machine throughput metrics and identify the bottleneck.
    Returns total_traffic (sum of all items/min).
    Called every 20 ticks (1/second).
    """
    # Reset bottleneck flags
    for m in metrics.values():
        m.is_bottleneck = False

    total_traffic = 0.0

    for pos, cell in cells.items():
        b = cell.building
        if b is None or b.type not in PRODUCTION_TYPES:
            continue

        # items_produced_since_last_metric counts items produced in last second
        # (20 ticks). Multiply by 60 to get items/min.
        items_last_second = b.items_produced_since_last_metric
        b.items_produced_since_last_metric = 0

        items_per_min = items_last_second * 60.0

        metric = metrics.setdefault(pos, MachineMetrics(pos=pos))
        metric.items_per_min = items_per_min
        metric.has_demand = b.has_demand
        total_traffic += items_per_min

    # Identify bottleneck: lowest-producing machine that has demand
    active = [m for m in metrics.values() if m.has_demand and m.items_per_min >= 0]
    if active:
        bottleneck = min(active, key=lambda m: m.items_per_min)
        bottleneck.is_bottleneck = True

    return total_traffic

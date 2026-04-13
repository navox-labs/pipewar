"""
In-memory game state dataclasses. These are NOT ORM models -- they live in
the GameEngine during a session and are serialized to JSON for DB persistence.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
from .enums import BuildingType, ItemType, Direction, AttackType


@dataclass
class BeltItem:
    item_type: ItemType
    position: float  # 0.0 (entry) to 1.0 (exit)


@dataclass
class Building:
    type: BuildingType
    direction: Direction
    health: int = 100
    input_buffer: dict[str, int] = field(default_factory=dict)
    output_buffer: dict[str, int] = field(default_factory=dict)
    processing_ticks_remaining: int = 0
    items_produced: int = 0               # total lifetime
    items_produced_since_last_metric: int = 0
    items_per_min: float = 0.0
    is_bottleneck: bool = False
    has_demand: bool = False
    # belt-specific
    belt_items: list[BeltItem] = field(default_factory=list)


@dataclass
class Resource:
    item_type: ItemType   # iron_ore or copper_ore
    remaining: int = 9999


@dataclass
class Cell:
    x: int
    y: int
    building: Optional[Building] = None
    resource: Optional[Resource] = None


@dataclass
class Attacker:
    id: str
    attack_type: AttackType
    x: float               # fractional grid position
    y: float
    hp: int
    max_hp: int
    speed: float           # cells per tick
    damage_per_tick: int
    path: list[tuple[int, int]] = field(default_factory=list)
    path_index: int = 0    # current position in path
    idle_ticks: int = 0    # ticks without a valid path
    # trail for rendering
    trail: list[tuple[float, float]] = field(default_factory=list)


@dataclass
class Wave:
    wave_number: int
    attack_types: list[AttackType]
    total_attackers: int
    has_boss: bool
    spawned: int = 0
    blocked: int = 0
    leaked: int = 0
    damage_dealt: int = 0
    active: bool = True


@dataclass
class MachineMetrics:
    pos: tuple[int, int]
    items_per_min: float = 0.0
    is_bottleneck: bool = False
    has_demand: bool = False

"""
Main game engine -- runs the simulation tick loop.
Architecture doc section 5.1.

One GameEngine instance per active game. Runs as an asyncio task.
"""
from __future__ import annotations
import asyncio
import time
import json
import logging
from typing import Callable, Awaitable
from uuid import UUID

from backend.config import (
    TICK_RATE, BROADCAST_EVERY, METRICS_EVERY, AUTOSAVE_EVERY,
    IDLE_CLEANUP_TICKS, WAVE_TRIGGER_TRAFFIC, WAVE_COOLDOWN_TICKS,
    WIN_CIRCUITS, WIN_UPTIME, LOSE_UPTIME, GRID_SIZE,
)
from backend.models.enums import (
    BuildingType, Direction, PRODUCTION_TYPES, DEFENSE_TYPES,
)
from backend.models.game_state import Cell, Building, Resource, Attacker, Wave, MachineMetrics
from backend.engine.grid import parse_grid, serialize_grid
from backend.engine.production import tick_machine
from backend.engine.belts import tick_belts
from backend.engine.metrics import compute_metrics
from backend.combat.pathfinding import compute_defense_coverage
from backend.combat.attacker import spawn_attacker, tick_attacker, ATTACKER_STATS
from backend.combat.wave_generator import generate_wave, hp_scale_for_wave, spawn_type_for_index
from backend.combat.defense import find_exposed_machines, slow_ddos_bots

log = logging.getLogger(__name__)

# Ticks between wave spawns (spread spawns over first 5 seconds of wave)
SPAWN_INTERVAL = 10


class GameEngine:
    """
    Server-authoritative game simulation.
    Runs at TICK_RATE (20) ticks/second in a background asyncio task.
    """

    def __init__(
        self,
        game_id: str,
        grid_state: dict,
        advanced_circuits: int = 0,
        total_ticks: int = 0,
        downtime_ticks: int = 0,
        current_wave: int = 0,
    ):
        self.game_id = game_id
        self.grid: dict[tuple[int, int], Cell] = parse_grid(grid_state)
        self.tick_count: int = 0
        self.advanced_circuits: int = advanced_circuits
        self.total_ticks: int = total_ticks
        self.downtime_ticks: int = downtime_ticks
        self.current_wave: int = current_wave
        self.active_wave: Wave | None = None
        self.attackers: list[Attacker] = []
        self.metrics: dict[tuple[int, int], MachineMetrics] = {}
        self._running: bool = False
        self._paused: bool = False
        self._cleanup_flag: bool = False
        self._ticks_since_last_wave: int = 0
        self._wave_spawn_queue: list = []
        self._circuit_breaker_active_ticks: int = 0
        self._defense_coverage: dict = {}
        self._coverage_dirty: bool = True  # recompute on first tick

        # Callbacks set by WebSocket handler
        self.on_broadcast: Callable[[str, dict], Awaitable[None]] | None = None
        self.on_save: Callable[[], Awaitable[None]] | None = None
        self.on_game_over: Callable[[dict], Awaitable[None]] | None = None

        # Total traffic (sum items/min across all machines)
        self.total_traffic: float = 0.0
        # Exposed machine positions during waves
        self.exposed_machines: set[tuple[int, int]] = set()

        # Auto-save task handle
        self._save_task: asyncio.Task | None = None

        # Idle tracking
        self._idle_ticks: int = 0

    # -----------------------------------------------------------------------
    # Public interface
    # -----------------------------------------------------------------------

    async def run(self):
        """Main tick loop. Runs until stopped."""
        self._running = True
        tick_interval = 1.0 / TICK_RATE
        log.info(f"GameEngine {self.game_id} started")

        while self._running:
            start = time.monotonic()

            if not self._paused:
                await self._tick()

            elapsed = time.monotonic() - start
            sleep_time = max(0.0, tick_interval - elapsed)
            await asyncio.sleep(sleep_time)

        log.info(f"GameEngine {self.game_id} stopped")

    def stop(self):
        self._running = False

    def toggle_pause(self):
        self._paused = not self._paused

    def mark_active(self):
        """Called by WS handler to reset idle timer."""
        self._idle_ticks = 0

    def is_coverage_dirty(self) -> bool:
        return self._coverage_dirty

    def place_building(
        self,
        x: int,
        y: int,
        building_type: BuildingType,
        direction: Direction,
    ) -> str | None:
        """
        Place a building on the grid.
        Returns None on success, or an error string on failure.
        """
        pos = (x, y)
        cell = self.grid.get(pos)
        if cell is None:
            return "Invalid cell"
        if cell.building is not None:
            return "Cell is occupied"
        if cell.resource and building_type not in DEFENSE_TYPES:
            # Miners can go on resource tiles, others cannot
            if building_type != BuildingType.MINER:
                return "Cannot place building on resource tile"
        if building_type == BuildingType.MINER and not cell.resource:
            return "Miner must be placed on a resource tile"

        cell.building = Building(type=building_type, direction=direction)
        if building_type in DEFENSE_TYPES:
            self._coverage_dirty = True
        return None

    def remove_building(self, x: int, y: int) -> str | None:
        """Remove a building from a cell. Returns error string or None."""
        pos = (x, y)
        cell = self.grid.get(pos)
        if cell is None:
            return "Invalid cell"
        if cell.building is None:
            return "No building at this cell"
        was_defense = cell.building.type in DEFENSE_TYPES
        cell.building = None
        if was_defense:
            self._coverage_dirty = True
            # Invalidate all attacker paths so they recalculate
            for att in self.attackers:
                att.path = []
        return None

    def rotate_building(self, x: int, y: int, direction: Direction) -> str | None:
        pos = (x, y)
        cell = self.grid.get(pos)
        if cell is None or cell.building is None:
            return "No building at this cell"
        cell.building.direction = direction
        return None

    def get_state_snapshot(self) -> dict:
        """Full grid state for state_sync messages."""
        return {
            "type": "state_sync",
            "tick": self.tick_count,
            "grid": serialize_grid(self.grid),
            "advanced_circuits": self.advanced_circuits,
            "uptime_pct": self._uptime_pct(),
            "current_wave": self.current_wave,
            "status": "paused" if self._paused else "active",
            "exposed_machines": [list(p) for p in self.exposed_machines],
        }

    def get_serializable_grid(self) -> dict:
        return serialize_grid(self.grid)

    def _uptime_pct(self) -> float:
        if self.total_ticks == 0:
            return 100.0
        return ((self.total_ticks - self.downtime_ticks) / self.total_ticks) * 100.0

    # -----------------------------------------------------------------------
    # Core tick
    # -----------------------------------------------------------------------

    async def _tick(self):
        self.tick_count += 1
        self.total_ticks += 1

        # Recompute defense coverage when layout changes
        if self._coverage_dirty:
            self._defense_coverage = compute_defense_coverage(self.grid)
            self._coverage_dirty = False
            # Invalidate all paths
            for att in self.attackers:
                att.path = []

        # Production simulation
        self._tick_belts()
        new_circuits = self._tick_machines()
        self.advanced_circuits += new_circuits

        # Combat
        self._tick_wave_spawner()
        damage_this_tick = self._tick_attackers()
        self._tick_uptime()
        self._check_end_conditions()

        # Metrics every second
        if self.tick_count % METRICS_EVERY == 0:
            self.total_traffic = compute_metrics(self.grid, self.metrics)
            if self.active_wave:
                self.exposed_machines = find_exposed_machines(
                    self.grid, self._defense_coverage
                )

        # Broadcast tick update every BROADCAST_EVERY ticks
        if self.tick_count % BROADCAST_EVERY == 0:
            await self._broadcast_tick()

        # Full state sync every 100 ticks (5 seconds)
        if self.tick_count % 100 == 0:
            await self._broadcast_state_sync()

        # Metrics broadcast every second
        if self.tick_count % METRICS_EVERY == 0:
            await self._broadcast_metrics()

        # Auto-save every minute
        if self.tick_count % AUTOSAVE_EVERY == 0 and self.on_save:
            asyncio.create_task(self.on_save())

        # Idle cleanup
        self._idle_ticks += 1
        if self._idle_ticks >= IDLE_CLEANUP_TICKS and self.on_save:
            asyncio.create_task(self.on_save())
            self.stop()

    def _tick_belts(self):
        tick_belts(self.grid)

    def _tick_machines(self) -> int:
        """Returns total advanced_circuits produced this tick."""
        total = 0
        for pos, cell in self.grid.items():
            if cell.building and cell.building.type in PRODUCTION_TYPES:
                total += tick_machine(cell, self.grid)
        return total

    def _tick_wave_spawner(self):
        """
        Manage wave timing:
        - Trigger first wave when factory_traffic >= WAVE_TRIGGER_TRAFFIC
        - Trigger subsequent waves WAVE_COOLDOWN_TICKS after previous wave ends
        - Spawn attackers from the spawn queue at SPAWN_INTERVAL ticks
        """
        # Spawn queued attackers
        if self._wave_spawn_queue and self.tick_count % SPAWN_INTERVAL == 0:
            spawn_type = self._wave_spawn_queue.pop(0)
            hp_scale = hp_scale_for_wave(self.current_wave)
            att = spawn_attacker(spawn_type, hp_scale)
            self.attackers.append(att)
            if self.active_wave:
                self.active_wave.spawned += 1

        # Check if active wave is over (all spawned and all dead)
        if self.active_wave and self.active_wave.active:
            all_spawned = self.active_wave.spawned >= self.active_wave.total_attackers and not self._wave_spawn_queue
            if all_spawned and len(self.attackers) == 0:
                self._end_wave()

        # Should we start a new wave?
        if self.active_wave is None or not self.active_wave.active:
            if self.active_wave is None:
                # First wave: trigger on factory traffic
                if self.total_traffic >= WAVE_TRIGGER_TRAFFIC:
                    self._start_wave()
            else:
                # Subsequent waves: cooldown after previous wave ended
                self._ticks_since_last_wave += 1
                if self._ticks_since_last_wave >= WAVE_COOLDOWN_TICKS:
                    self._ticks_since_last_wave = 0
                    self._start_wave()

    def _start_wave(self):
        self.current_wave += 1
        wave = generate_wave(self.current_wave, self.total_traffic)
        self.active_wave = wave

        # Build spawn queue
        self._wave_spawn_queue = [
            spawn_type_for_index(wave, i) for i in range(wave.total_attackers)
        ]

        log.info(f"Wave {self.current_wave} started: {wave.total_attackers} attackers")

        # Notify clients
        if self.on_broadcast:
            asyncio.create_task(
                self.on_broadcast(
                    self.game_id,
                    {
                        "type": "wave_start",
                        "wave_number": wave.wave_number,
                        "total_attackers": wave.total_attackers,
                        "attack_types": [t.value for t in wave.attack_types],
                        "has_boss": wave.has_boss,
                    },
                )
            )

    def _end_wave(self):
        wave = self.active_wave
        wave.active = False
        self._ticks_since_last_wave = 0
        log.info(
            f"Wave {wave.wave_number} ended: "
            f"blocked={wave.blocked}, leaked={wave.leaked}"
        )

        if self.on_broadcast:
            asyncio.create_task(
                self.on_broadcast(
                    self.game_id,
                    {
                        "type": "wave_end",
                        "wave_number": wave.wave_number,
                        "attackers_blocked": wave.blocked,
                        "attackers_leaked": wave.leaked,
                    },
                )
            )

        # Persist wave history
        asyncio.create_task(self._save_wave_history(wave))

    async def _save_wave_history(self, wave: Wave):
        from backend.db.queries.games import record_wave
        try:
            await record_wave(
                game_id=self.game_id,
                wave_number=wave.wave_number,
                attack_types=[t.value for t in wave.attack_types],
                attackers_spawned=wave.spawned,
                attackers_blocked=wave.blocked,
                attackers_leaked=wave.leaked,
                damage_dealt=wave.damage_dealt,
            )
        except Exception as e:
            log.error(f"Failed to save wave history: {e}")

    def _tick_attackers(self) -> int:
        """Move and apply combat for all attackers. Returns total damage dealt."""
        if not self.attackers:
            return 0

        slow_ddos_bots(self.attackers, self._defense_coverage)

        total_damage = 0
        alive = []

        for attacker in self.attackers:
            result = tick_attacker(attacker, self.grid, self._defense_coverage)
            total_damage += result["damage"]

            if result["alive"]:
                alive.append(attacker)
            else:
                # Attacker eliminated (blocked by defense)
                if attacker.hp <= 0:
                    if self.active_wave:
                        self.active_wave.blocked += 1
                else:
                    # Despawned (no path) counts as leaked
                    if self.active_wave:
                        self.active_wave.leaked += 1

            if result["damage"] > 0 and self.active_wave:
                self.active_wave.damage_dealt += result["damage"]

        # Handle leaked attackers (reached west edge x=0 without dying)
        still_alive = []
        for att in alive:
            if int(att.x) <= 0 and att.path_index >= len(att.path):
                # Leaked through to the other side
                if self.active_wave:
                    self.active_wave.leaked += 1
            else:
                still_alive.append(att)

        self.attackers = still_alive
        return total_damage

    def _tick_uptime(self):
        """Count downtime ticks (any production machine at health == 0)."""
        has_downtime = any(
            cell.building and cell.building.type in PRODUCTION_TYPES
            and cell.building.health == 0
            for cell in self.grid.values()
        )
        if has_downtime:
            self.downtime_ticks += 1

    def _check_end_conditions(self):
        """Win/lose checks. Only after first wave has been triggered."""
        if self.active_wave is None:
            return  # game hasn't started yet

        uptime = self._uptime_pct()

        # Win
        if self.advanced_circuits >= WIN_CIRCUITS and uptime >= WIN_UPTIME:
            self._game_over("won", uptime)
            return

        # Lose
        if uptime < LOSE_UPTIME:
            self._game_over("lost", uptime)

    def _game_over(self, result: str, uptime: float):
        self._running = False
        payload = {
            "type": "game_over",
            "result": result,
            "final_uptime": round(uptime, 2),
            "advanced_circuits": self.advanced_circuits,
            "waves_survived": self.current_wave,
        }
        if self.on_broadcast:
            asyncio.create_task(self.on_broadcast(self.game_id, payload))
        if self.on_save:
            asyncio.create_task(self._persist_final_status(result, uptime))

    async def _persist_final_status(self, status: str, uptime: float):
        from backend.db.queries.games import save_game
        try:
            await save_game(
                game_id=self.game_id,
                grid_state=serialize_grid(self.grid),
                advanced_circuits=self.advanced_circuits,
                uptime_pct=round(uptime, 2),
                current_wave=self.current_wave,
                total_ticks=self.total_ticks,
                downtime_ticks=self.downtime_ticks,
                status=status,
            )
        except Exception as e:
            log.error(f"Failed to persist final status: {e}")

    # -----------------------------------------------------------------------
    # Broadcast helpers
    # -----------------------------------------------------------------------

    async def _broadcast_tick(self):
        if not self.on_broadcast:
            return
        belt_items = []
        for (x, y), cell in self.grid.items():
            b = cell.building
            if b and b.type == BuildingType.BELT:
                for item in b.belt_items:
                    belt_items.append({
                        "x": x, "y": y,
                        "item_type": item.item_type.value,
                        "position": item.position,
                    })

        machine_states = []
        for (x, y), cell in self.grid.items():
            b = cell.building
            if b and b.type in PRODUCTION_TYPES:
                machine_states.append({
                    "x": x, "y": y,
                    "type": b.type.value,
                    "health": b.health,
                    "processing": b.processing_ticks_remaining > 0,
                    "output_buffer": b.output_buffer,
                })

        attackers = [
            {
                "id": a.id,
                "type": a.attack_type.value,
                "x": round(a.x, 3),
                "y": round(a.y, 3),
                "hp": a.hp,
                "max_hp": a.max_hp,
                "trail": [[round(p[0], 2), round(p[1], 2)] for p in a.trail],
            }
            for a in self.attackers
        ]

        await self.on_broadcast(
            self.game_id,
            {
                "type": "tick_update",
                "tick": self.tick_count,
                "belt_items": belt_items,
                "machine_states": machine_states,
                "attackers": attackers,
                "exposed_machines": [list(p) for p in self.exposed_machines],
            },
        )

    async def _broadcast_state_sync(self):
        if not self.on_broadcast:
            return
        await self.on_broadcast(self.game_id, self.get_state_snapshot())

    async def _broadcast_metrics(self):
        if not self.on_broadcast:
            return
        machines = [
            {
                "pos": list(pos),
                "items_per_min": round(m.items_per_min, 1),
                "is_bottleneck": m.is_bottleneck,
                "has_demand": m.has_demand,
            }
            for pos, m in self.metrics.items()
        ]
        await self.on_broadcast(
            self.game_id,
            {
                "type": "metrics",
                "machines": machines,
                "total_traffic": round(self.total_traffic, 1),
            },
        )

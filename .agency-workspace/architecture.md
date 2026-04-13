# PIPEWAR -- System Architecture Document
## Version 1.0 | 2026-04-12 | Architect Agent

---

## 1. System Overview

PIPEWAR is a single-player browser game where players build Factorio-style production
pipelines on a 20x20 grid and defend them against automated hacker attack waves.
The game is won by producing 20 Advanced Circuits while maintaining 99.9% uptime.
The game is lost if uptime drops below 95%.

There are no user accounts. Game state is tied to a browser session via an HTTP-only
cookie. The simulation runs entirely server-side at 20 ticks/second. The client
receives real-time updates over WebSocket and sends player actions (place/remove
buildings, start wave) via the same WebSocket connection.

### Component Diagram

```
+------------------+         HTTPS / WSS         +-------------------+
|                  | <-------------------------> |                   |
|   Next.js 15     |    REST: game CRUD          |   FastAPI         |
|   (Vercel)       |    WS: tick updates,        |   (Fly.io)        |
|                  |        player actions        |                   |
|   - Grid render  |                              |   - REST API      |
|   - HUD/metrics  |                              |   - WS handler    |
|   - Defense UI   |                              |   - Tick engine   |
|   - Attack viz   |                              |   - Attack AI     |
|                  |                              |   - A* pathfinder |
+------------------+                              +--------+----------+
                                                           |
                                                           | asyncpg
                                                           |
                                                  +--------v----------+
                                                  |                   |
                                                  |   PostgreSQL      |
                                                  |   (Neon)          |
                                                  |                   |
                                                  +-------------------+
```

### Key Architectural Properties
- **Stateful server process**: Each active game holds its simulation state in memory.
  PostgreSQL is the persistence layer (save/load), not the tick-by-tick store.
- **Single WebSocket per game**: All real-time communication flows through one
  connection. No polling.
- **No horizontal scaling needed initially**: Target is single-player. One Fly.io
  machine handles hundreds of concurrent games.

---

## 2. Tech Stack

| Layer            | Technology                  | Justification                                                    |
|------------------|-----------------------------|------------------------------------------------------------------|
| Frontend         | Next.js 15 + TypeScript     | SSR for initial load, client-side canvas rendering for game grid |
| Styling          | Tailwind CSS                | Utility-first, fast iteration, no runtime CSS overhead           |
| Grid Rendering   | HTML Canvas (2D context)    | 20x20 grid with animated belts/items needs 60fps; DOM is too slow|
| Backend          | Python FastAPI              | async-native, WebSocket support built in, clean API contracts    |
| Simulation       | asyncio background task     | Native Python async; one coroutine per active game               |
| Database         | PostgreSQL (Neon serverless) | Structured game state, session management, ACID for saves       |
| DB Driver        | asyncpg                     | Fastest async PostgreSQL driver for Python                       |
| Real-time        | FastAPI WebSocket            | Native support, no additional dependencies                      |
| Frontend Deploy  | Vercel                      | Zero-config Next.js deployment                                  |
| Backend Deploy   | Fly.io                      | Persistent processes, WebSocket support, global edge network     |

---

## 3. Data Model

### 3.1 sessions

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days'
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### 3.2 games

```sql
CREATE TYPE game_status AS ENUM ('active', 'won', 'lost', 'abandoned');

CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    status game_status NOT NULL DEFAULT 'active',
    current_wave INT NOT NULL DEFAULT 0,
    advanced_circuits_produced INT NOT NULL DEFAULT 0,
    uptime_pct NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    total_ticks BIGINT NOT NULL DEFAULT 0,
    downtime_ticks BIGINT NOT NULL DEFAULT 0,
    grid_state JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_games_session ON games(session_id);
CREATE INDEX idx_games_status ON games(status) WHERE status = 'active';
```

### 3.3 grid_state JSONB Schema

```jsonc
{
  "buildings": {
    "3,5": {
      "type": "smelter",
      "direction": "east",
      "health": 100,
      "input_buffer": {"iron_ore": 2},
      "output_buffer": {"iron_plate": 1},
      "processing_ticks_remaining": 0
    },
    "4,5": {
      "type": "belt",
      "direction": "east",
      "items": [
        {"type": "iron_plate", "position": 0.5}
      ]
    }
  },
  "defenses": {
    "10,10": {
      "type": "rate_limiter",
      "health": 100,
      "active": true
    }
  },
  "resources": {
    "0,0": {"type": "iron_ore", "remaining": 9999},
    "0,19": {"type": "copper_ore", "remaining": 9999}
  }
}
```

### 3.4 wave_history

```sql
CREATE TABLE wave_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    wave_number INT NOT NULL,
    attack_types TEXT[] NOT NULL,
    attackers_spawned INT NOT NULL,
    attackers_blocked INT NOT NULL DEFAULT 0,
    attackers_leaked INT NOT NULL DEFAULT 0,
    damage_dealt INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_wave_history_game ON wave_history(game_id);
```

### 3.5 Enums (application-level)

```python
class BuildingType(str, Enum):
    MINER = "miner"
    SMELTER = "smelter"
    ASSEMBLER = "assembler"
    BELT = "belt"
    RATE_LIMITER = "rate_limiter"
    WAF = "waf"
    AUTH_MIDDLEWARE = "auth_middleware"
    CIRCUIT_BREAKER = "circuit_breaker"

class ItemType(str, Enum):
    IRON_ORE = "iron_ore"
    COPPER_ORE = "copper_ore"
    IRON_PLATE = "iron_plate"
    COPPER_PLATE = "copper_plate"
    COPPER_WIRE = "copper_wire"
    GREEN_CIRCUIT = "green_circuit"
    ADVANCED_CIRCUIT = "advanced_circuit"
```

---

## 4. Production Chain Specification

### 4.1 Recipes

| Machine    | Inputs                              | Output             | Ticks to Process |
|------------|-------------------------------------|--------------------|------------------|
| Miner      | (on resource tile)                  | 1x ore             | 10 (2/sec)       |
| Smelter    | 1x Iron Ore                        | 1x Iron Plate      | 20 (1/sec)       |
| Smelter    | 1x Copper Ore                      | 1x Copper Plate    | 20 (1/sec)       |
| Assembler  | 1x Copper Plate                    | 2x Copper Wire     | 15 (1.33/sec)    |
| Assembler  | 1x Iron Plate + 3x Copper Wire     | 1x Green Circuit   | 30 (0.67/sec)    |
| Assembler  | 2x Green Circuit                   | 1x Advanced Circuit| 60 (0.33/sec)    |

### 4.2 Machine Behavior Per Tick

```
1. If output_buffer is full (capacity: 5 items), STALL. Do nothing.
2. If processing_ticks_remaining > 0, decrement by 1.
   If it hits 0, move output to output_buffer.
3. If processing_ticks_remaining == 0 and required inputs are in input_buffer:
   Consume inputs, set processing_ticks_remaining = recipe.ticks.
4. Pull from adjacent belt/machine output_buffer into input_buffer (max 10).
```

### 4.3 Belt Behavior Per Tick

```
1. Items on belt move 0.1 units per tick in the belt's direction.
2. When item.position >= 1.0, attempt to transfer to the next cell:
   - If next cell is a belt: add to its items list at position 0.0
   - If next cell is a machine: add to its input_buffer (if recipe accepts it)
   - If next cell is empty or incompatible: item stalls at position 1.0
3. Max 3 items per belt tile. If full, upstream items stall.
4. Merge rule: at intersections, items alternate from each incoming belt (round-robin).
```

---

## 5. Game Engine Design

### 5.1 Tick Loop Architecture

```python
class GameEngine:
    def __init__(self, game_id: UUID, grid_state: dict):
        self.game_id = game_id
        self.grid: dict[tuple[int,int], Cell] = parse_grid(grid_state)
        self.tick_count: int = 0
        self.advanced_circuits: int = 0
        self.total_ticks: int = 0
        self.downtime_ticks: int = 0
        self.active_wave: Wave | None = None
        self.attackers: list[Attacker] = []
        self.metrics: dict[tuple[int,int], MachineMetrics] = {}
        self._running: bool = False

    async def run(self):
        self._running = True
        tick_interval = 1.0 / 20.0
        while self._running:
            start = time.monotonic()
            self.tick()
            elapsed = time.monotonic() - start
            sleep_time = max(0, tick_interval - elapsed)
            await asyncio.sleep(sleep_time)

    def tick(self):
        self.tick_count += 1
        self.total_ticks += 1
        self._tick_belts()
        self._tick_machines()
        self._tick_attackers()
        self._tick_damage()
        self._tick_uptime()
        self._check_end_conditions()
        if self.tick_count % 20 == 0:
            self._compute_metrics()
        if self.tick_count % 2 == 0:
            self._broadcast()
```

### 5.2 Uptime Calculation

```
uptime_pct = ((total_ticks - downtime_ticks) / total_ticks) * 100

A "downtime tick" is any tick where at least one production machine is
non-functional (health == 0) due to attacker damage.

Win condition:  advanced_circuits >= 20 AND uptime_pct >= 99.9
Lose condition: uptime_pct < 95.0 (checked every tick after first wave)
```

### 5.3 Bottleneck Detection

```python
def _compute_metrics(self):
    for pos, cell in self.grid.items():
        if cell.building and cell.building.type in PRODUCTION_TYPES:
            metric = self.metrics.setdefault(pos, MachineMetrics(pos))
            items_produced_last_second = cell.building.items_produced_since_last_metric
            metric.items_per_min = items_produced_last_second * 60
            cell.building.items_produced_since_last_metric = 0

    active_machines = [m for m in self.metrics.values() if m.has_demand]
    if active_machines:
        bottleneck = min(active_machines, key=lambda m: m.items_per_min)
        bottleneck.is_bottleneck = True
```

### 5.4 Save/Load Strategy

- Auto-save every 60 seconds
- Save on WebSocket disconnect
- Load on reconnect, resume tick loop
- Idle cleanup after 5 minutes with no connection

---

## 6. Attack System Design

### 6.1 Attack Types

| Type                | Behavior                                     | Speed (cells/tick) | HP  | Damage/tick |
|---------------------|----------------------------------------------|--------------------|-----|-------------|
| DDoS Bot            | Swarm, low HP, overwhelms by numbers         | 0.15               | 30  | 2           |
| Credential Stuffer  | Medium speed, targets auth_middleware gaps    | 0.10               | 60  | 5           |
| SQL Injection Probe | Seeks undefended paths, ignores WAF-covered  | 0.08               | 80  | 10          |
| Peak Load Attack    | Fast, high damage, targets circuit_breakers  | 0.20               | 50  | 8           |
| Zero-Day Exploit    | Boss. Slow but massive HP and damage         | 0.05               | 300 | 25          |

### 6.2 Wave Generator

```python
def generate_wave(wave_number: int, factory_traffic: float) -> Wave:
    base_count = 5 + wave_number * 3
    traffic_multiplier = 1.0 + (factory_traffic / 100.0)
    total_attackers = int(base_count * traffic_multiplier)
    available_types = ATTACK_TYPES[:min(wave_number, 5)]
    has_boss = (wave_number % 5 == 0)
    # Scale HP with wave number
    hp_scale = 1.0 + (wave_number - 1) * 0.15
    # Boss appears every 5th wave with 1.5x extra HP
```

### 6.3 Wave Trigger

First wave triggers when factory_traffic >= 10. Subsequent waves trigger
200 ticks (10 seconds) after the previous wave ends.

### 6.4 A* Pathfinding

Standard A* on 20x20 grid. Manhattan distance heuristic. Defense buildings
are impassable. Moving adjacent to defense costs +5. SQL injection probes
treat WAF-covered cells as impassable. Credential stuffers pay +10 for
auth_middleware-covered cells. Recalculate when defenses change.

### 6.5 Attacker Movement Per Tick

1. If no path: run A*. If unreachable: idle 10 ticks then despawn.
2. Move along path by speed. Fractional positions tracked.
3. In defense range: take defense DPS per tick.
4. Reaching production machine: deal damage_per_tick.
5. HP <= 0: removed from simulation.

### 6.6 Spawn Points

Attackers spawn from east edge (x=19, y=random 0-19).

---

## 7. Defense System Design

### 7.1 Defense Types

| Defense          | DPS to Attackers | Coverage        | Special                                          |
|------------------|------------------|-----------------|--------------------------------------------------|
| Rate Limiter     | 3/tick           | self + 8 adj    | Slows DDoS bots by 50%                           |
| WAF              | 5/tick           | self + 8 adj    | Blocks SQL injection probes from entering zone    |
| Auth Middleware   | 4/tick           | self + 8 adj    | +200% damage to Credential Stuffers              |
| Circuit Breaker  | 2/tick           | self + 8 adj    | When HP<30%, blocks ALL attackers 5s              |

### 7.2 Coverage Model

A defense at (x,y) covers 9 cells: the cell itself and all 8 adjacent cells.
Multiple defenses stack damage.

### 7.3 Gap Detection

Every tick during a wave, any production building NOT in any defense's coverage
zone is "exposed". SQL injection probes specifically target exposed machines.
HUD highlights exposed machines with red outline.

### 7.4 Defense Placement Rules

- Can be placed on any empty cell (not on resource tiles, belts, or machines)
- Can be removed at any time
- Defenses are invulnerable (infrastructure, not units)

---

## 8. Session Management

Cookie-based, no auth:
- Cookie: `pipewar_session`, UUID v4, HttpOnly, Secure, SameSite=Lax, 7-day expiry
- One active game per session
- Session validated via middleware on every request
- Expired sessions cleaned up daily

---

## 9. API Contract

### 9.1 REST Endpoints

```
POST /api/sessions       -> 201 { session_id, expires_at }
GET  /api/sessions/me    -> 200 { session_id, has_active_game }
POST /api/games          -> 201 { game_id, grid, status }
GET  /api/games/current  -> 200 { game_id, status, grid, advanced_circuits, uptime_pct, current_wave }
DELETE /api/games/current -> 200 { status: "abandoned" }
GET  /health             -> 200 { status: "ok" }
```

### 9.2 WebSocket

```
WS /api/games/{game_id}/ws  (requires session cookie)
```

---

## 10. WebSocket Protocol

### Client -> Server

```jsonc
{ "type": "place_building", "x": 5, "y": 3, "building_type": "smelter", "direction": "east" }
{ "type": "remove_building", "x": 5, "y": 3 }
{ "type": "rotate_building", "x": 5, "y": 3, "direction": "south" }
{ "type": "toggle_pause" }
```

### Server -> Client

```jsonc
// Full state sync (on connect + every 5 seconds)
{ "type": "state_sync", "tick": 12345, "grid": {}, "advanced_circuits": 3, "uptime_pct": 99.85, "current_wave": 2, "status": "active" }

// Tick update (every 2 ticks = 10/sec)
{ "type": "tick_update", "tick": 12346, "belt_items": [...], "machine_states": [...], "attackers": [...] }

// Metrics (every 20 ticks = 1/sec)
{ "type": "metrics", "machines": [...], "total_traffic": 142.5 }

// Wave events
{ "type": "wave_start", "wave_number": 3, "total_attackers": 18, "attack_types": [...], "has_boss": false }
{ "type": "wave_end", "wave_number": 3, "attackers_blocked": 15, "attackers_leaked": 3 }

// Game over
{ "type": "game_over", "result": "won", "final_uptime": 99.92, "advanced_circuits": 20, "waves_survived": 7 }

// Errors and confirmations
{ "type": "error", "message": "Cannot place smelter on resource tile" }
{ "type": "building_placed", "x": 5, "y": 3, "building_type": "smelter" }
{ "type": "building_removed", "x": 5, "y": 3 }
```

---

## 11. Visual Design -- Ocean Palette (STRICT)

Background: #00214d | Grid bg: #001433 | Panel bg: #001a3d | Panel border: #0a3d7a
Production machines active: #38bdf8 | Text: #7dd3fc
Circuits: #34d399 | Iron ore: #854d0e on #0f0a02 | Copper ore: #b45309 on #0f0a02
Belt lines: #1e4080 | Attackers: #f43f5e (flicker 0.4s) | Trails: #7f1d1d 50% opacity
Defenses: #1d4ed8 border, #60a5fa text | Active: #34d399 dot | Offline: #2a1a1a dot
Warnings: #f59e0b | Critical: #f43f5e | Uptime: #e0e0e0 large, #34d399 accent
Font: JetBrains Mono throughout. No gradients. No shadows. Flat. Clean.

Grid symbols: M=Miner, S=Smelter, A=Assembler, belts=lines, circuits=diamond,
ore=shade, defenses=block, hackers=red diamond flickering, empty=dot

---

## 12. File Structure

### Backend

```
backend/
  main.py
  config.py
  requirements.txt
  Dockerfile
  fly.toml
  api/
    __init__.py
    sessions.py
    games.py
    websocket.py
  db/
    __init__.py
    connection.py
    migrations/001_initial.sql
    queries/sessions.py
    queries/games.py
  engine/
    __init__.py
    game_engine.py
    grid.py
    production.py
    belts.py
    metrics.py
  combat/
    __init__.py
    attacker.py
    wave_generator.py
    pathfinding.py
    defense.py
  models/
    __init__.py
    enums.py
    schemas.py
    game_state.py
  tests/
    conftest.py
    test_engine.py
    test_production.py
    test_belts.py
    test_pathfinding.py
    test_wave_generator.py
    test_defense.py
    test_api_sessions.py
    test_api_games.py
    test_websocket.py
```

### Frontend

```
frontend/
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
  public/
  src/
    app/
      layout.tsx
      page.tsx
      game/page.tsx
    components/
      game/
        GameCanvas.tsx
        HUD.tsx
        BuildPanel.tsx
        MetricsPanel.tsx
        WaveAlert.tsx
        GameOverModal.tsx
      ui/
        Button.tsx
        Card.tsx
        ProgressBar.tsx
    hooks/
      useWebSocket.ts
      useGameState.ts
      useGridInteraction.ts
    lib/
      api.ts
      types.ts
      constants.ts
    stores/
      gameStore.ts
```

---

## 13. Key Decisions

1. **Fly.io instead of Cloudflare Workers** -- Workers cannot run persistent asyncio loops or WebSocket servers. Non-negotiable.
2. **Canvas rendering** -- DOM cannot handle 60fps grid animation.
3. **No Redis** -- Unnecessary for single-player. In-memory dicts are the cache.
4. **Server-authoritative** -- All game logic server-side. Client is a renderer.
5. **Single WebSocket** -- All real-time communication through one connection per game.
6. **Neon for PostgreSQL** -- Serverless, free tier, pairs with Fly.io.
7. **Initial grid**: Iron ore at (0,5) and (0,14), copper ore at (0,0) and (0,19). Attackers from east edge (x=19).

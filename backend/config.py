"""
PIPEWAR backend configuration.
All tunable constants live here so nothing is magic-numbered across the codebase.
"""
import os

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", 8000))
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DB_PATH = os.environ.get("DB_PATH", "pipewar.db")

# ---------------------------------------------------------------------------
# Session / Cookie
# ---------------------------------------------------------------------------
COOKIE_NAME = "pipewar_session"
SESSION_TTL_DAYS = 7

# ---------------------------------------------------------------------------
# Game engine
# ---------------------------------------------------------------------------
TICK_RATE = 20                # ticks per second
BROADCAST_EVERY = 2           # ticks  (10 msg/sec to clients)
METRICS_EVERY = 20            # ticks  (1/sec)
FULL_SYNC_EVERY = 100         # ticks  (5/sec)
AUTOSAVE_EVERY = 1200         # ticks  (60 seconds)
IDLE_CLEANUP_TICKS = 6000     # 5 minutes with no WS

WAVE_TRIGGER_TRAFFIC = 10.0   # factory_traffic threshold for first wave
WAVE_COOLDOWN_TICKS = 200     # 10 seconds between waves
WIN_CIRCUITS = 20
WIN_UPTIME = 99.9
LOSE_UPTIME = 95.0

# ---------------------------------------------------------------------------
# Grid
# ---------------------------------------------------------------------------
GRID_SIZE = 20

# Initial resource positions
IRON_ORE_TILES = [(0, 5), (0, 14)]
COPPER_ORE_TILES = [(0, 0), (0, 19)]
INITIAL_ORE_AMOUNT = 9999

# ---------------------------------------------------------------------------
# Security (C-01, C-02, C-09)
# ---------------------------------------------------------------------------
WS_RATE_LIMIT = 10            # max messages per second per connection
WS_RATE_VIOLATION_LIMIT = 3   # violations before disconnect
WS_MAX_MESSAGE_BYTES = 1024   # 1 KB (C-04)

MAX_ACTIVE_GAMES = 200        # global cap (C-02)
WS_GLOBAL_CAP = 250           # total open WebSocket connections (C-09)

SESSION_RATE_LIMIT = "5/minute"   # per IP (C-02)
GAME_RATE_LIMIT = "3/minute"      # per session (C-02)

-- PIPEWAR initial schema (SQLite-compatible)
-- Architecture doc section 3.1 - 3.4

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL DEFAULT (datetime('now', '+7 days'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active','won','lost','abandoned')),
    current_wave INTEGER NOT NULL DEFAULT 0,
    advanced_circuits_produced INTEGER NOT NULL DEFAULT 0,
    uptime_pct REAL NOT NULL DEFAULT 100.0,
    total_ticks INTEGER NOT NULL DEFAULT 0,
    downtime_ticks INTEGER NOT NULL DEFAULT 0,
    grid_state TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_games_session ON games(session_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- C-02: one active game per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_game
    ON games(session_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS wave_history (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    wave_number INTEGER NOT NULL,
    attack_types TEXT NOT NULL,
    attackers_spawned INTEGER NOT NULL,
    attackers_blocked INTEGER NOT NULL DEFAULT 0,
    attackers_leaked INTEGER NOT NULL DEFAULT 0,
    damage_dealt INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_wave_history_game ON wave_history(game_id)

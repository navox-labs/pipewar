
## 2026-04-12 -- PIPEWAR complete implementation
- Backend: FastAPI + aiosqlite (not asyncpg -- local dev only). All 10 security constraints implemented.
- Engine: asyncio background task, 20 ticks/sec, GameEngine class in backend/engine/game_engine.py
- A* pathfinding in backend/combat/pathfinding.py -- readable, well-commented
- DB queries all parameterized (C-07) -- aiosqlite uses ? placeholders (not $1 like asyncpg)
- C-05 compliance: session_id set via Set-Cookie header only, never in response body
- Next.js version installed is 16.2.3 (NOT 15 as spec said) -- uses Tailwind v4 CSS-first config (@theme inline in globals.css)
- No tailwind.config.ts needed for Next.js 16 -- colors defined with --color-* CSS variables in @theme inline
- Canvas renderer: requestAnimationFrame loop, separate from WS (10/sec). Belt items interpolated by position field
- Zustand store at src/stores/gameStore.ts -- all game state managed here
- 56 unit tests all passing (backend). Frontend build clean (0 errors, 0 warnings after CSS import fix)
- Belt item transfer test: items placed at position 0.0 get advanced by BELT_SPEED in same tick -- test must account for this

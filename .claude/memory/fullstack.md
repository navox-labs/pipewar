
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

## 2026-04-12 -- Onboarding tutorial + font size pass
- TutorialOverlay.tsx: localStorage key `pipewar_tutorial_complete`, 5 steps, zIndex 900 (backdrop 800, GameOverModal is 999)
- Tutorial injects keyframe CSS via a <style> tag inside the component -- no global CSS file needed
- Font size targets per spec: HUD labels 14px / values 18px, BuildPanel name 16px / shortcut 14px, Metrics headers 14px / values 16px, event log 14px, GameOverModal title 36px / stats 18px
- Canvas glyph font: main font set once at line ~58 in GameCanvas.tsx, reset line after attacker glyph draw -- both bumped 16->20px
- Build clean: 0 errors, 0 warnings (only pre-existing workspace root lockfile warning from turbopack)


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

## 2026-04-14 -- Bug fix pass: 8 critical/moderate bugs fixed
- Bug #1: defense.py:40 circuit breaker check was `b.health < b.health * 0.3` (always false) -- fixed to `b.health < 100 * 0.3`
- Bug #2: circuit breaker was dead code -- wired check_circuit_breaker_activation() into _tick() in game_engine.py; when active, attacker movement is skipped for CIRCUIT_BREAKER_DURATION ticks
- Bug #3: BUILDING_GLYPHS["belt"] key added as fallback; hover preview in GameCanvas now uses `belt_${direction}` for directional glyph
- Bug #4: production.py _pull_inputs had `break` after pulling from production machine -- changed to `continue` so all 4 neighbours are checked (fixes assembler starvation)
- Bug #5: Miners had no push logic -- added _push_outputs() in production.py, called from _tick_machines() for each miner cell after tick_machine
- Bug #6: websocket.py building_placed response used fragile hasattr check -- simplified to BuildingType(msg.building_type).value
- Bug #7: Verified correct behavior -- defense DPS is applied before attacker movement, so camped attackers CAN be killed. No fix needed.
- Bug #8: Added applyBuildingPlaced/applyBuildingRemoved actions to gameStore.ts; wired building_placed and building_removed cases in useWebSocket.ts
- Test count: 56 -> 65 (9 new unit tests added across test_defense.py and test_production.py)
- _push_outputs is a module-level function (not method) -- import it explicitly in game_engine.py

## 2026-04-14 -- Frontend redesign: scene3-gameplay.html visual style
- New color palette: bg #0b1622, accent #5af78e, borders #1a2a3a, grid #0e1a27
- Font changed from JetBrains Mono to Menlo, Monaco, 'Courier New', monospace (system font, no Google Fonts import)
- globals.css: removed @import for Google Fonts, updated all --color-pw-* CSS variables
- constants.ts: new COLORS map, added BUILDING_COLORS (per-type glyph colors: miner=#57c7ff, smelter=#f3f99d, assembler=#ff6ac1, rl=#5af78e, waf=#f0883e, auth=#57c7ff, cb=#f3f99d)
- GameCanvas.tsx: grid dots at intersections (1.5px arc), faint 0.3px grid lines, scene3-style building tiles (colored border + 0.15 alpha fill), attacker glow (pulsing arc radius 10), trail as small arcs, defense range circles, hover preview with outline box
- BuildPanel.tsx: 160px width, 2-col grid tiles with colored glyph (fontSize 14 bold), key [N] label, name; selected tile has border #57c7ff + bg #122238
- MetricsPanel.tsx: 200px, defense grouped by type (glyph + name x count), attacker color map for wave types, event log uses slice(-8) for last 8 entries
- HUD.tsx: uptime 20px bold #5af78e, pause button border #5af78e, wave info at right
- WaveAlert.tsx: positioned below HUD (top:48), red dot + bold red "WAVE N INCOMING" text
- GameOverModal.tsx: dark #0d1926 bg, accent border, ghost button style (transparent fill, colored border)
- TutorialOverlay.tsx: #0d1926 bg, #5af78e accent, ghost next button style
- LandingPage.tsx: #0b1622 bg, #5af78e title, ghost button style
- Build: 0 errors, 0 warnings (only pre-existing workspace lockfile warning from turbopack)

## 2026-04-14 — Refactor: inline styles -> Tailwind CSS
- Tailwind v4 custom colors referenced as `text-pw-*`, `bg-pw-*`, `border-pw-*` (defined in @theme inline block in globals.css)
- Added new color tokens: --color-pw-text-faint (#7090b0), --color-pw-text-hint (#5a7a9a), --color-pw-chain (#8aa0b8), --color-pw-building-selected-bg, --color-pw-building-tile-bg, --color-pw-building-selected-border, --color-pw-building-tile-border, --color-pw-canvas-border (#1a2a3a), --color-pw-connecting (#6b7280)
- Dynamic/computed colors (uptimeColor, accentColor win/lose, glyphColor per building type, attackerColor per attacker type, eventColor per event type) must stay as inline style={{ color }} since they're runtime values
- Dynamic border/bg for BuildingTile (selected state) stays inline since it's prop-driven -- can't use Tailwind conditionals with non-standard hex values
- WaveAlert opacity stays inline (fading ? 0 : 1 is a runtime value)
- GameCanvas: canvas drawing code (ctx.*) untouched; only JSX wrapper converted; cursor stays inline (dynamic), border converted to border-pw-canvas-border
- annotationStyle in TutorialOverlay stays inline -- colors come from the highlight prop (dynamic per-step)
- hover onMouseEnter/onMouseLeave handlers stay as JS for interactive elements with computed colors (buttons that swap between accentColor states)
- Build: 0 errors, 0 warnings (only pre-existing workspace lockfile warning from turbopack)

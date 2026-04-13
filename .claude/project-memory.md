# PIPEWAR Project Memory

## Run: 2026-04-12 — Full game build from scratch

### Decisions made
- Fly.io instead of Cloudflare Workers for backend (Workers can't run persistent asyncio loops)
- aiosqlite for local dev instead of PostgreSQL (easier setup)
- HTML Canvas for grid rendering instead of DOM (60fps performance)
- No Redis — in-memory game state is sufficient for single-player
- Server-authoritative simulation — client is a pure renderer
- Cookie Secure flag tied to IS_PRODUCTION env var (security audit finding)

### Files created or modified
- `backend/` — Complete FastAPI backend (engine, combat, API, WebSocket, DB)
- `frontend/` — Complete Next.js frontend (Canvas grid, HUD, panels, Zustand store)
- `backend/Dockerfile` — Multi-stage build for Fly.io
- `backend/fly.toml` — Fly.io config (min 1 machine, persistent volume)
- `frontend/vercel.json` — Vercel deployment config
- `README.md` — Game description, attack types, local run instructions
- `.agency-workspace/` — Architecture doc, UX specs, security reviews

### Agents run
- architect: System design document (data model, API, engine, file structure)
- ux: Component specs (ocean palette, layout, interactions)
- security: Design review (10 constraints) + code audit (all PASS)
- fullstack: Complete game implementation (82 files, 13,934 lines)
- local-review: 4 rounds (tutorial added, font sizes adjusted, overflow fixed)
- devops: Dockerfile, fly.toml, vercel.json, README

### Local review verdict
- Round 1: FEEDBACK (WebSocket not connecting — timing issue)
- Round 2: FEEDBACK (needs tutorial + larger fonts)
- Round 3: FEEDBACK (uptime text overflow + sidebar horizontal scroll)
- Round 4: FEEDBACK (all fonts still too large)
- Round 5: LGTM

### Context for next run
- Backend uses aiosqlite — production deploy needs persistent volume on Fly.io
- Fly CLI auth and `fly volumes create` needed before first deploy
- Vercel needs GitHub integration or CLI auth
- 56 backend tests passing
- No E2E tests yet (QA was skipped to accelerate)
- Demo agent was activated but not run (build moved fast)

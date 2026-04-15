
## 2026-04-12 — PIPEWAR initial deployment config
- Backend imports as `backend.main` — Dockerfile WORKDIR must be /app (parent of backend/), not backend/
- fly deploy must be run from repo root (not from backend/) so Docker build context includes the backend/ directory
- aiosqlite SQLite in use (not asyncpg/Postgres yet) — DB_PATH=/data/pipewar.db on Fly persistent volume `pipewar_data`
- fly.toml: min_machines_running=1 is critical — WebSocket game state lives in-process, cannot let machines scale to zero
- FRONTEND_ORIGIN secret must be set via `fly secrets set` before first deploy — not in fly.toml
- vercel.json env vars point at pipewar-backend.fly.dev — update app name in fly.toml if the Fly app name changes
- Security headers in vercel.json mirror those already in next.config.ts — Vercel layer + Next.js layer both apply

## 2026-04-14 -- Bug fix deployment pass
- 8 critical bugs committed and pushed to main (commit 206ca01)
- Frontend auto-deployed to Vercel via git push to main
- flyctl not installed on this machine -- installed via brew install flyctl (0.4.34)
- flyctl requires interactive browser login -- no FLY_API_TOKEN or ~/.fly/config.yml present
- Backend deploy BLOCKED on auth -- user must run: flyctl auth login && flyctl deploy
- Alternative: set FLY_API_TOKEN env var and re-run flyctl deploy for non-interactive flow


## 2026-04-12 — PIPEWAR initial architecture
- Single-player browser game: build Factorio-style pipelines on 20x20 grid, defend against hacker waves
- Stack: Next.js 15 (Vercel) + FastAPI (Fly.io) + SQLite (aiosqlite, not Postgres yet)
- Session: cookie-based, no user accounts
- Server-authoritative: 20 ticks/sec engine, WebSocket for real-time updates
- Win: produce 20 Advanced Circuits at 99.9% uptime. Lose: uptime < 95%

## 2026-04-14 — DIAGNOSE: Critical bugs identified in production
- Backend deployed to Fly.io (pipewar-backend), frontend to Vercel (frontend-beta-five-83)
- Key bugs found in code review (see diagnosis output for full list)
- Circuit breaker activation check is broken (compares health to itself)
- Belt glyph lookup uses `belt_east` etc but building type is just `belt`
- Production machine output stalls can cascade (pull logic has early `break` in wrong scope)
- Miner output doesn't go to belt/machine — no push-to-adjacent logic for miners

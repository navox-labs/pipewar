# PIPEWAR

Build a Factorio-style production pipeline in your browser and defend it against automated hacker attack waves.

**[Play Now](https://frontend-beta-five-83.vercel.app)**

---

## Live URLs

- **Frontend**: https://frontend-beta-five-83.vercel.app
- **Backend**: https://pipewar-backend-588857514802.us-central1.run.app

---

## How It Works

You place miners, smelters, assemblers, and conveyor belts on a 20x20 grid to produce Advanced Circuits. Once your factory generates enough traffic, hacker waves begin spawning from the east edge of the grid. You win by producing 20 Advanced Circuits while keeping factory uptime above 99.9%. Drop below 95% uptime and you lose.

The simulation runs entirely server-side at 20 ticks per second. The client is a pure renderer that receives real-time state over a single WebSocket connection. There are no user accounts — your game is tied to a browser session cookie.

---

## Attack Types

| Attack | Behavior |
|---|---|
| DDoS Bot | Swarm attacker — low HP, high numbers, overwhelms by volume |
| Credential Stuffer | Medium speed, targets gaps in Auth Middleware coverage |
| SQL Injection Probe | Seeks undefended paths, ignores WAF-covered cells |
| Peak Load Attack | Fast, high damage, specifically targets Circuit Breakers |
| Zero-Day Exploit | Boss unit — slow, 300 HP, 25 damage/tick, appears every 5th wave |

---

## Run Locally

```bash
# Terminal 1 — backend (from repo root)
pip install -r backend/requirements.txt && uvicorn backend.main:app --reload --port 8080

# Terminal 2 — frontend
cd frontend && npm ci && npm run dev
```

Open http://localhost:3000.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, HTML Canvas |
| Backend | Python 3.12, FastAPI, asyncio |
| Real-time | WebSocket (one connection per game) |
| Database | aiosqlite (local), PostgreSQL/Neon (production) |
| Frontend deploy | Vercel |
| Backend deploy | Fly.io (persistent process, WebSocket-compatible) |

---

Built with one prompt using [Navox Agents](https://github.com/navox-labs/agents) for Claude Code.

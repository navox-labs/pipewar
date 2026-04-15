# PIPEWAR

Build production pipelines. Defend against cyber attacks. Produce 20 Advanced Circuits to win.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with Navox Agents](https://img.shields.io/badge/built%20with-Navox%20Agents-5af78e)](https://github.com/navox-labs/agents)
[![Play Now](https://img.shields.io/badge/play-now-ff4757)](https://frontend-beta-five-83.vercel.app)

<img width="2752" height="1536" alt="Game Poster" src="https://github.com/user-attachments/assets/fe20fd2f-9e7a-4aa5-a5e2-b112074471e4" />


---

## Play Now

**[https://frontend-beta-five-83.vercel.app](https://frontend-beta-five-83.vercel.app)**

No install. No account. Click and play.

---

## What is PipeWar?

PipeWar is a browser-based tower defense game inspired by [Factorio](https://factorio.com)'s production chain mechanics, themed around cybersecurity.

You build a factory on a 20x20 grid: mine ore, smelt it into plates, assemble plates into circuits. Connect everything with conveyor belts. The production chain is the core — raw resources in, Advanced Circuits out.

The twist: once your factory generates enough traffic, waves of cyber attackers spawn from the east edge. DDoS bots swarm your machines. SQL injection probes seek undefended paths. Zero-Day exploits tank through your defenses. You defend with security tools — Rate Limiters, WAFs, Auth Middleware, Circuit Breakers — each with unique mechanics. Win by producing 20 Advanced Circuits while keeping uptime above 95%. Drop below and your system is compromised.

The simulation is server-authoritative at 20 ticks/second. The client is a renderer. There are no user accounts — your game is tied to a browser session cookie.

---

## How to Play

### Production Chain

```
Iron Ore ──→ Smelter ──→ Iron Plate ─────────────────┐
                                                      ├──→ Assembler ──→ Green Circuit ──→ Assembler ──→ Advanced Circuit
Copper Ore ──→ Smelter ──→ Copper Plate ──→ Assembler ──→ Copper Wire ──┘
```

Place buildings left-to-right. Connect them with belts. Each building must **face the direction** of the next building in the chain (press `R` to rotate).

### Buildings

| Key | Building | Role |
|-----|----------|------|
| `1` | Miner | Place on ore tiles. Extracts raw ore. |
| `2` | Smelter | Converts ore into plates. |
| `3` | Assembler | Combines plates/wire into circuits. Recipe depends on inputs. |
| `4` | Belt | Moves items between buildings. Must face the right direction. |
| `5` | Rate Limiter | Slows DDoS bots by 50%. 3 DPS. |
| `6` | WAF | Blocks SQL injection probes from entering coverage zone. 5 DPS. |
| `7` | Auth Middleware | 3x damage to Credential Stuffers. 4 DPS. |
| `8` | Circuit Breaker | When HP drops below 30%, blocks ALL attackers for 5 seconds. |

### Controls

| Key | Action |
|-----|--------|
| `R` | Rotate building direction |
| `Esc` | Deselect building |
| `Space` | Pause / Resume |
| `Del` / `Backspace` | Remove building under cursor |
| `Click` | Place selected building |
| `Right-click` | Remove building |

### Attack Waves

Waves trigger automatically when factory traffic reaches 10 items/min. Attackers spawn from the east edge and path toward your production machines.

| Attacker | HP | Speed | Damage | Special |
|----------|-----|-------|--------|---------|
| DDoS Bot | 30 | Fast | 2/tick | Swarms in numbers |
| Credential Stuffer | 60 | Medium | 5/tick | Targets auth gaps |
| SQL Injection Probe | 80 | Slow | 10/tick | Ignores WAF zones |
| Peak Load Attack | 50 | Very fast | 8/tick | Targets circuit breakers |
| Zero-Day Exploit | 300 | Very slow | 25/tick | Boss. Every 5th wave. |

Build defenses on the right side of the grid. Each defense covers a 3x3 area. Stack defenses for more damage.

---

## Built with AI

PipeWar was built and maintained entirely by [Navox Agents](https://github.com/navox-labs/agents) — an open-source AI engineering team for Claude Code.

The agent team (Architect, Full Stack, QA, Security, DevOps) diagnosed 8 critical bugs, fixed the production chain logic, redesigned the frontend, and deployed to production — all in a single session. 65 tests passing.

Install the agents: `/plugin marketplace add navox-labs/agents && /plugin install navox-agents`

---

## Tech Stack

| Layer | Technology | Deploy |
|-------|-----------|--------|
| Frontend | Next.js 15, TypeScript, HTML Canvas | Vercel |
| Backend | FastAPI, Python 3.12, asyncio | Fly.io |
| Database | SQLite (aiosqlite) | Fly.io persistent volume |
| Real-time | WebSocket, 20 ticks/sec server-authoritative | — |
| Session | Cookie-based, no user accounts | — |

---

## Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Screenshots

*Screenshots coming soon.*

---

## Contributing

Contributions welcome. Open an issue or submit a PR.

This project uses [Navox Agents](https://github.com/navox-labs/agents) for development — consider using `/navox-agents:architect` to diagnose issues before diving into code.

---

## License

MIT

---

Built by [Navox Labs](https://github.com/navox-labs) · Powered by [Navox Agents](https://github.com/navox-labs/agents)

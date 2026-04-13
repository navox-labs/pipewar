
## 2026-04-12 -- Initial local review of PIPEWAR
- Backend (FastAPI on :8000) and frontend (Next.js 16 on :3000) both start cleanly
- Landing page renders correctly with proper PIPEWAR branding
- Game page renders full UI chrome (3-panel layout, build toolbar, stats) but grid shows "CONNECTING..." due to WebSocket not connecting
- Backend has endpoints: /api/sessions, /api/sessions/me, /api/games, /api/games/current, /health
- screencapture on macOS captures desktop not Chrome window -- need to use window-specific capture or headless browser for screenshots
- Key issue to investigate: WebSocket connection between frontend and backend for game grid rendering

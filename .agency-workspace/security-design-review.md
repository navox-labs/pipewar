# PIPEWAR -- Security Design Review
## Version 1.0 | 2026-04-12 | Security Agent
## Mode: DESIGN-REVIEW

---

## Threat Model

**Attackers**: Bored scripters (DoS), game cheaters (state manipulation), automated scanners.
**No PII, no credentials, no payments.** Threat surface is significantly reduced.

---

## Findings

### FINDING-01: WebSocket Message Rate Limiting Not Specified
**Severity: HIGH**

No rate limiting on WebSocket messages. Malicious client can flood `place_building` messages, causing CPU exhaustion on the single Fly.io machine affecting all concurrent games.

**Remediation**: Per-connection rate limiter in `backend/api/websocket.py`. Cap at 10 msg/sec. After 3 violations, disconnect with close code 1008.

---

### FINDING-02: No Limit on Concurrent Sessions or Games
**Severity: HIGH**

`POST /api/sessions` and `POST /api/games` have no rate limiting. Each game spins up an in-memory GameEngine coroutine. Hundreds of games will exhaust memory.

**Remediation**:
- Global active game limit: 200, return 503 when exceeded
- Rate limit session creation: 5/min per IP
- Rate limit game creation: 3/min per session
- Add unique partial index: `CREATE UNIQUE INDEX idx_one_active_game ON games(session_id) WHERE status = 'active'`

---

### FINDING-03: WebSocket Connection Not Validated Against Session Ownership
**Severity: HIGH**

Architecture doesn't specify verifying that `game_id` in WebSocket URL belongs to the connecting session. Any valid session could connect to any game.

**Remediation**: Verify `game.session_id == session.id` before accepting WebSocket connection. Close with code 4003 on mismatch.

---

### FINDING-04: WebSocket Input Validation Not Specified
**Severity: MEDIUM**

No validation rules for WebSocket messages. Could send out-of-bounds coordinates, invalid types, or oversized payloads.

**Remediation**: Pydantic models for all incoming messages. Grid bounds 0-19. Enum validation. Max message size 1 KB.

---

### FINDING-05: Session ID Exposed in REST Response Body
**Severity: MEDIUM**

Returning session_id in response body defeats HttpOnly cookie purpose. XSS vector could read it from API responses.

**Remediation**: Never return session_id in response bodies. Cookie set via Set-Cookie header only.

---

### FINDING-06: CORS Configuration Not Specified
**Severity: MEDIUM**

Cross-origin setup (Vercel + Fly.io). Wildcard CORS would allow credentialed requests from any site.

**Remediation**: Exact frontend origin only, never wildcard. `allow_credentials=True`. Add localhost conditionally for dev only.

---

### FINDING-07: No Maximum WebSocket Connections Per Session/IP
**Severity: MEDIUM**

No enforcement of single WebSocket per game or global connection cap.

**Remediation**: 1 WebSocket per game (new closes old). Global cap: 250 connections.

---

### FINDING-08: CSRF (SameSite=Lax Is Sufficient)
**Severity: LOW**

SameSite=Lax + strict CORS mitigates CSRF. No additional token needed.

---

### FINDING-09: Database Query Safety
**Severity: LOW**

All queries must use asyncpg parameterized queries ($1, $2). No f-strings or .format() for SQL.

---

### FINDING-10: Security Headers Not Specified
**Severity: LOW**

Add: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin.

---

### FINDING-11: Error Messages Must Not Leak Internal State
**Severity: LOW**

WebSocket error messages must use predefined safe strings only. No tracebacks to clients.

---

### FINDING-12: Idle Game Cleanup Race Condition
**Severity: LOW**

Use a lock/flag during cleanup. Reject new connections during cleanup. Ensure save completes before removing engine from memory.

---

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0     |
| HIGH     | 3     |
| MEDIUM   | 4     |
| LOW      | 5     |

---

## Security Constraints for Fullstack Agent (Non-Negotiable)

| ID   | Constraint | Location |
|------|-----------|----------|
| C-01 | WebSocket rate limiter: 10 msg/sec, disconnect after 3 violations | `backend/api/websocket.py` |
| C-02 | Session rate limit 5/min/IP, game rate limit 3/min/session, global game cap 200, unique partial index | `backend/api/sessions.py`, `backend/api/games.py` |
| C-03 | Validate WebSocket game ownership before connection | `backend/api/websocket.py` |
| C-04 | Pydantic validation on all WS messages, bounds 0-19, enums, 1KB max | `backend/models/schemas.py` |
| C-05 | Never return session_id in response bodies | `backend/api/sessions.py` |
| C-06 | CORS: exact frontend origin, never wildcard, allow_credentials=True | `backend/main.py` |
| C-07 | Parameterized queries only, no string formatting in SQL | `backend/db/queries/` |
| C-08 | Error messages from predefined safe strings only | All backend files |
| C-09 | 1 WebSocket per game, global connection cap 250 | `backend/api/websocket.py` |
| C-10 | Security headers on all responses | `backend/main.py`, `frontend/next.config.ts` |

---

## Verdict

**PENDING** -- Design approved for build. Launch verdict after code audit.

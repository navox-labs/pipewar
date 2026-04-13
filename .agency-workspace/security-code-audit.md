# PIPEWAR -- Security Code Audit
## 2026-04-12 | Security Agent | MODE: CODE-AUDIT

## Constraint Verification

| ID | Constraint | Verdict | Evidence |
|----|-----------|---------|----------|
| C-01 | WS rate limiter 10/sec, disconnect after 3 | PASS | websocket.py:148-182 |
| C-02 | Session 5/min/IP, game 3/min/session, cap 200 | PASS | sessions.py, games.py, migration |
| C-03 | WS game ownership validation | PASS | websocket.py:92-113 |
| C-04 | Pydantic validation, bounds 0-19, 1KB max | PASS | schemas.py, websocket.py:166-196 |
| C-05 | No session_id in responses | PASS | sessions.py, games.py |
| C-06 | CORS exact origin, no wildcard | PASS | main.py:23-37 |
| C-07 | Parameterized queries only | PASS | queries/*.py |
| C-08 | Safe error strings only | PASS | All files |
| C-09 | 1 WS/game, global cap 250 | PASS | websocket.py |
| C-10 | Security headers | PASS | main.py, next.config.ts |

## Additional Findings

- FINDING-A (IMPORTANT, FIXED): Cookie secure=False was hardcoded. Now tied to IS_PRODUCTION env var.
- FINDING-B (MINOR): No global exception handler. Recommended.
- FINDING-C (MINOR): In-memory rate limiter dicts grow unbounded. Low risk.
- FINDING-E (MINOR): _total_connections race window under asyncio. Theoretical only.

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| IMPORTANT | 1 (FIXED) |
| MINOR | 3 |

## Launch Verdict

**APPROVED** -- All constraints pass. FINDING-A resolved. Minor findings are non-blocking.

// REST API client
import { API_BASE } from "./constants";

// Store ws_token for WebSocket auth (WS goes directly to Fly.io, not through Vercel proxy)
let _wsToken: string | null = null;
export function getWsToken(): string | null { return _wsToken; }

export async function createSession(): Promise<{ expires_at: string; has_active_game: boolean }> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Session creation failed: ${res.status}`);
  const data = await res.json();
  if (data.ws_token) _wsToken = data.ws_token;
  return data;
}

export async function getSessionMe(): Promise<{ has_active_game: boolean }> {
  const res = await fetch(`${API_BASE}/api/sessions/me`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Session fetch failed: ${res.status}`);
  return res.json();
}

export async function createGame(): Promise<{
  game_id: string;
  status: string;
  grid: object;
  advanced_circuits: number;
  uptime_pct: number;
  current_wave: number;
}> {
  const res = await fetch(`${API_BASE}/api/games`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Game creation failed: ${res.status}`);
  return res.json();
}

export async function getCurrentGame(): Promise<{
  game_id: string;
  status: string;
  grid: object;
  advanced_circuits: number;
  uptime_pct: number;
  current_wave: number;
} | null> {
  const res = await fetch(`${API_BASE}/api/games/current`, {
    credentials: "include",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Game fetch failed: ${res.status}`);
  return res.json();
}

export async function deleteCurrentGame(): Promise<void> {
  await fetch(`${API_BASE}/api/games/current`, {
    method: "DELETE",
    credentials: "include",
  });
}

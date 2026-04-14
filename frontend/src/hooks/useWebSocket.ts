"use client";
import { useEffect, useRef, useCallback } from "react";
import { WS_BASE } from "@/lib/constants";
import { getWsToken } from "@/lib/api";
import { useGameStore } from "@/stores/gameStore";
import type { ServerMessage } from "@/lib/types";

const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket(gameId: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const store = useGameStore();

  const connect = useCallback(() => {
    if (!gameId) return;
    if (ws.current?.readyState === WebSocket.OPEN) return;

    // Pass session token as query param for WS auth (cookie is on Vercel domain)
    const token = getWsToken();
    const params = token ? `?session=${encodeURIComponent(token)}` : "";
    const url = `${WS_BASE}/api/games/${gameId}/ws${params}`;
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      reconnectAttempts.current = 0;
      store.setConnected(true);
    };

    socket.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data) as ServerMessage;
      } catch {
        return;
      }

      switch (msg.type) {
        case "state_sync":
          store.applyStateSync(msg);
          break;
        case "tick_update":
          store.applyTickUpdate(msg);
          break;
        case "metrics":
          store.applyMetrics(msg);
          break;
        case "wave_start":
          store.applyWaveStart(msg);
          break;
        case "wave_end":
          store.applyWaveEnd(msg);
          break;
        case "game_over":
          store.applyGameOver(msg);
          break;
        case "building_placed":
          store.applyBuildingPlaced(msg);
          break;
        case "building_removed":
          store.applyBuildingRemoved(msg);
          break;
        case "error":
          store.addEvent({
            timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
            message: msg.message,
            eventType: "warning",
          });
          break;
        case "ping":
          break;
        default:
          break;
      }
    };

    socket.onclose = () => {
      store.setConnected(false);
      // Auto-reconnect
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current += 1;
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession, getSessionMe, createGame, getCurrentGame } from "@/lib/api";
import { useGameStore } from "@/stores/gameStore";

export function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const setGameId = useGameStore((s) => s.setGameId);

  const handleNewGame = async () => {
    setLoading(true);
    setError(false);
    try {
      await createSession();
      const game = await createGame();
      setGameId(game.game_id);
      router.push("/game");
    } catch (e) {
      console.error(e);
      setError(true);
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setLoading(true);
    setError(false);
    try {
      const game = await getCurrentGame();
      if (game) {
        setGameId(game.game_id);
        router.push("/game");
      }
    } catch (e) {
      console.error(e);
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#00214d",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      }}
    >
      <div style={{ maxWidth: 600, textAlign: "center", padding: 32 }}>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#38bdf8",
            margin: "0 0 16px",
            letterSpacing: "0.05em",
          }}
        >
          PIPEWAR
        </h1>
        <p style={{ fontSize: 18, color: "#6b7280", margin: "0 0 12px" }}>
          Build. Produce. Defend.
        </p>
        <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 32px", lineHeight: 1.6 }}>
          Build production pipelines on a 20×20 grid.
          <br />
          Defend against hacker waves. Produce 20 Advanced Circuits to win.
        </p>

        <button
          onClick={handleNewGame}
          disabled={loading}
          style={{
            width: 240,
            height: 48,
            background: error ? "transparent" : "#1d4ed8",
            border: "1px solid #0a3d7a",
            color: error ? "#f43f5e" : "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            display: "block",
            margin: "0 auto",
          }}
          onMouseEnter={(e) => {
            if (!loading && !error)
              (e.currentTarget as HTMLButtonElement).style.background = "#38bdf8";
          }}
          onMouseLeave={(e) => {
            if (!error)
              (e.currentTarget as HTMLButtonElement).style.background = "#1d4ed8";
          }}
        >
          {loading ? "CONNECTING..." : error ? "FAILED — RETRY" : "NEW GAME"}
        </button>

        <ResumeButton onResume={handleResume} />
      </div>
    </div>
  );
}

function ResumeButton({ onResume }: { onResume: () => void }) {
  const [hasActiveGame, setHasActiveGame] = useState<boolean | null>(null);

  // Check for existing game on mount
  useState(() => {
    getSessionMe()
      .then((s) => setHasActiveGame(s.has_active_game))
      .catch(() => setHasActiveGame(false));
  });

  if (!hasActiveGame) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={onResume}
        style={{
          background: "transparent",
          border: "none",
          color: "#60a5fa",
          fontSize: 14,
          cursor: "pointer",
          fontFamily: "'JetBrains Mono', monospace",
          textDecoration: "underline",
        }}
      >
        RESUME GAME
      </button>
    </div>
  );
}

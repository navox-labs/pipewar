"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession, getSessionMe, createGame, getCurrentGame } from "@/lib/api";
import { useGameStore } from "@/stores/gameStore";

const FONT = "Menlo, Monaco, 'Courier New', monospace";

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
        fontFamily: FONT,
      }}
    >
      <div style={{ maxWidth: 520, textAlign: "center", padding: 32 }}>
        {/* Title */}
        <h1
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: "#5af78e",
            margin: "0 0 12px",
            letterSpacing: "0.08em",
          }}
        >
          PIPEWAR
        </h1>

        {/* Tagline */}
        <p style={{ fontSize: 13, color: "#a0b0c0", margin: "0 0 8px" }}>
          Build. Produce. Defend.
        </p>
        <p
          style={{
            fontSize: 11,
            color: "#7090b0",
            margin: "0 0 32px",
            lineHeight: 1.7,
          }}
        >
          Build production pipelines on a 20×20 grid.
          <br />
          Defend against hacker waves. Produce 20 Advanced Circuits to win.
        </p>

        {/* New Game button */}
        <button
          onClick={handleNewGame}
          disabled={loading}
          style={{
            width: 220,
            height: 44,
            background: "transparent",
            border: `1px solid ${error ? "#ff4757" : "#5af78e"}`,
            color: error ? "#ff4757" : "#5af78e",
            fontSize: 12,
            fontWeight: "bold",
            cursor: loading ? "wait" : "pointer",
            fontFamily: FONT,
            display: "block",
            margin: "0 auto",
            borderRadius: 3,
            letterSpacing: "0.05em",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = error ? "rgba(255,71,87,0.1)" : "rgba(90,247,142,0.1)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          {loading ? "CONNECTING..." : error ? "FAILED — RETRY" : "NEW GAME"}
        </button>

        <ResumeButton onResume={handleResume} />

        {/* Keyboard hint */}
        <div style={{ marginTop: 40, fontSize: 9, color: "#5a7a9a", lineHeight: 1.8 }}>
          1-4: production buildings &nbsp;|&nbsp; 5-8: defenses
          <br />
          R: rotate belt &nbsp;|&nbsp; Space: pause &nbsp;|&nbsp; Del: remove
        </div>
      </div>
    </div>
  );
}

function ResumeButton({ onResume }: { onResume: () => void }) {
  const [hasActiveGame, setHasActiveGame] = useState<boolean | null>(null);

  useState(() => {
    getSessionMe()
      .then((s) => setHasActiveGame(s.has_active_game))
      .catch(() => setHasActiveGame(false));
  });

  if (!hasActiveGame) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={onResume}
        style={{
          background: "transparent",
          border: "none",
          color: "#a0b0c0",
          fontSize: 11,
          cursor: "pointer",
          fontFamily: FONT,
          textDecoration: "underline",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#c0c0c0";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "#888";
        }}
      >
        RESUME GAME
      </button>
    </div>
  );
}

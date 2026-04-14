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
    <div className="min-h-screen flex items-center justify-center bg-pw-bg font-mono">
      <div className="max-w-[520px] text-center p-8">
        {/* Title */}
        <h1 className="text-[56px] font-bold text-pw-accent m-0 mb-3 tracking-[0.08em]">
          PIPEWAR
        </h1>

        {/* Tagline */}
        <p className="text-[13px] text-pw-text-dim m-0 mb-2">
          Build. Produce. Defend.
        </p>
        <p className="text-[11px] text-pw-text-faint m-0 mb-8 leading-[1.7]">
          Build production pipelines on a 20×20 grid.
          <br />
          Defend against hacker waves. Produce 20 Advanced Circuits to win.
        </p>

        {/* New Game button */}
        <button
          onClick={handleNewGame}
          disabled={loading}
          className="w-[220px] h-11 bg-transparent text-xs font-bold block mx-auto rounded-[3px] tracking-[0.05em] font-mono"
          style={{
            border: `1px solid ${error ? "#ff4757" : "#5af78e"}`,
            color: error ? "#ff4757" : "#5af78e",
            cursor: loading ? "wait" : "pointer",
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
        <div className="mt-10 text-[9px] text-pw-text-hint leading-[1.8]">
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
    <div className="mt-2.5">
      <button
        onClick={onResume}
        className="bg-transparent border-none text-pw-text-dim text-[11px] cursor-pointer font-mono underline"
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

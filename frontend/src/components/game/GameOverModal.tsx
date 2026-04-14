"use client";
import { useGameStore } from "@/stores/gameStore";
import { useRouter } from "next/navigation";
import { deleteCurrentGame, createGame } from "@/lib/api";

const FONT = "Menlo, Monaco, 'Courier New', monospace";

export function GameOverModal() {
  const { gameOverResult, resetGame, setGameId } = useGameStore();
  const router = useRouter();

  if (!gameOverResult) return null;

  const { result, final_uptime, advanced_circuits, waves_survived } = gameOverResult;
  const won = result === "won";
  const accentColor = won ? "#5af78e" : "#ff4757";

  const handlePlayAgain = async () => {
    resetGame();
    try {
      await deleteCurrentGame();
      const newGame = await createGame();
      setGameId(newGame.game_id);
    } catch (e) {
      console.error(e);
    }
    router.refresh();
  };

  const handleQuit = async () => {
    resetGame();
    await deleteCurrentGame().catch(() => {});
    router.push("/");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          width: 440,
          background: "#0d1926",
          border: `2px solid ${accentColor}`,
          padding: 32,
          borderRadius: 4,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: accentColor,
            marginBottom: 6,
            letterSpacing: "0.05em",
          }}
        >
          {won ? "SYSTEM SECURED" : "SYSTEM COMPROMISED"}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 24 }}>
          {won
            ? "20 Advanced Circuits produced"
            : "Uptime dropped below 95%"}
        </div>

        {/* Stats */}
        <div style={{ borderTop: "1px solid #1a2a3a", paddingTop: 16, marginBottom: 24 }}>
          {[
            ["Uptime", `${final_uptime.toFixed(2)}%`],
            ["Circuits", `${advanced_circuits} / 20`],
            ["Waves Survived", String(waves_survived)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              <span style={{ color: "#888" }}>{label}</span>
              <span style={{ color: "#e0e0e0" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Play Again */}
        <button
          onClick={handlePlayAgain}
          style={{
            width: "100%",
            height: 44,
            background: "transparent",
            border: `1px solid ${accentColor}`,
            color: accentColor,
            fontSize: 13,
            fontWeight: "bold",
            cursor: "pointer",
            fontFamily: FONT,
            marginBottom: 10,
            letterSpacing: "0.05em",
            borderRadius: 3,
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = accentColor;
            btn.style.color = "#0b1622";
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = "transparent";
            btn.style.color = accentColor;
          }}
        >
          PLAY AGAIN
        </button>

        {/* Quit */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleQuit}
            style={{
              background: "transparent",
              border: "none",
              color: "#555",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: FONT,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#888";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#555";
            }}
          >
            QUIT
          </button>
        </div>
      </div>
    </div>
  );
}

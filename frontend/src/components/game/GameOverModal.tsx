"use client";
import { useGameStore } from "@/stores/gameStore";
import { useRouter } from "next/navigation";
import { deleteCurrentGame, createGame } from "@/lib/api";

export function GameOverModal() {
  const { gameOverResult, resetGame, setGameId } = useGameStore();
  const router = useRouter();

  if (!gameOverResult) return null;

  const { result, final_uptime, advanced_circuits, waves_survived } = gameOverResult;
  const won = result === "won";

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
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <div
        style={{
          width: 480,
          background: "#001a3d",
          border: `2px solid ${won ? "#34d399" : "#f43f5e"}`,
          padding: 32,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: won ? "#34d399" : "#f43f5e",
            marginBottom: 8,
          }}
        >
          {won ? "SYSTEM SECURED" : "SYSTEM COMPROMISED"}
        </div>
        <div style={{ fontSize: 16, color: "#e0e0e0", marginBottom: 24 }}>
          {won
            ? "20 Advanced Circuits produced"
            : "Uptime dropped below 95%"}
        </div>

        {/* Stats */}
        <div style={{ borderTop: "1px solid #0a3d7a", paddingTop: 16, marginBottom: 24 }}>
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
                fontSize: 14,
              }}
            >
              <span style={{ color: "#6b7280" }}>{label}</span>
              <span style={{ color: "#e0e0e0" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={handlePlayAgain}
          style={{
            width: "100%",
            height: 48,
            background: "#1d4ed8",
            border: "1px solid #0a3d7a",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
            marginBottom: 12,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#38bdf8";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1d4ed8";
          }}
        >
          PLAY AGAIN
        </button>
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handleQuit}
            style={{
              background: "transparent",
              border: "none",
              color: "#6b7280",
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            QUIT
          </button>
        </div>
      </div>
    </div>
  );
}

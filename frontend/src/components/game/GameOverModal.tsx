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
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.75)] flex items-center justify-center z-[999] font-mono">
      <div
        className="w-[440px] bg-pw-panel-bg p-8 rounded-[4px]"
        style={{ border: `2px solid ${accentColor}` }}
      >
        {/* Title */}
        <div
          className="text-2xl font-bold mb-1.5 tracking-[0.05em]"
          style={{ color: accentColor }}
        >
          {won ? "SYSTEM SECURED" : "SYSTEM COMPROMISED"}
        </div>
        <div className="text-[11px] text-pw-text-dim mb-6">
          {won
            ? "20 Advanced Circuits produced"
            : "Uptime dropped below 95%"}
        </div>

        {/* Stats */}
        <div className="border-t border-pw-panel-border pt-4 mb-6">
          {[
            ["Uptime", `${final_uptime.toFixed(2)}%`],
            ["Circuits", `${advanced_circuits} / 20`],
            ["Waves Survived", String(waves_survived)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between mb-2 text-xs"
            >
              <span className="text-pw-text-dim">{label}</span>
              <span className="text-pw-text">{value}</span>
            </div>
          ))}
        </div>

        {/* Play Again */}
        <button
          onClick={handlePlayAgain}
          className="w-full h-11 bg-transparent text-[13px] font-bold cursor-pointer font-mono mb-2.5 tracking-[0.05em] rounded-[3px]"
          style={{ border: `1px solid ${accentColor}`, color: accentColor }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = accentColor;
            btn.style.color = "#00214d";
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
        <div className="text-center">
          <button
            onClick={handleQuit}
            className="bg-transparent border-none text-pw-text-faint text-[11px] cursor-pointer font-mono"
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
